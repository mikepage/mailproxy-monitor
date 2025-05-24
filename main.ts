async function readSmtpResponse(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): Promise<string[]> {
  const decoder = new TextDecoder();
  let buffer = "";
  const lines: string[] = [];

  while (true) {
    const { value, done } = await reader.read();
    if (done) throw new Error("Connection closed");

    buffer += decoder.decode(value, { stream: true });

    let lineEndIndex;
    while ((lineEndIndex = buffer.indexOf("\r\n")) !== -1) {
      const line = buffer.slice(0, lineEndIndex);
      buffer = buffer.slice(lineEndIndex + 2);
      lines.push(line);

      // Check if this is the last line of multiline response
      // Format: "xyz-" means more lines coming
      //          "xyz " means last line
      if (line.length >= 4) {
        const code = line.slice(0, 3);
        const delim = line[3];
        if (/^\d{3}$/.test(code) && delim === " ") {
          // End of multiline response
          return lines;
        }
      }
    }
  }
}

async function writeLine(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  line: string,
) {
  const encoder = new TextEncoder();
  await writer.write(encoder.encode(line + "\r\n"));
}

async function smtpSubmissionTest() {
  const hostname = Deno.args[0];
  const port = 587;

  console.log(`Connecting to ${hostname}:${port}...`);
  const conn = await Deno.connect({ hostname, port });
  const reader = conn.readable.getReader();
  const writer = conn.writable.getWriter();

  // Read greeting
  let respLines = await readSmtpResponse(reader);
  console.log("S:", respLines.join("\nS: "));

  // EHLO
  await writeLine(writer, "EHLO localhost");
  console.log("C: EHLO localhost");
  respLines = await readSmtpResponse(reader);
  console.log("S:", respLines.join("\nS: "));

  // STARTTLS
  await writeLine(writer, "STARTTLS");
  console.log("C: STARTTLS");
  respLines = await readSmtpResponse(reader);
  console.log("S:", respLines.join("\nS: "));

  if (!respLines[0].startsWith("220")) {
    console.error("STARTTLS failed");
    conn.close();
    return;
  }

  // Release old plain TCP stream locks
  reader.releaseLock();
  writer.releaseLock();

  // Upgrade to TLS
  const tlsConn = await Deno.startTls(conn, { hostname });
  const tlsReader = tlsConn.readable.getReader();
  const tlsWriter = tlsConn.writable.getWriter();

  // EHLO again after TLS
  await writeLine(tlsWriter, "EHLO localhost");
  console.log("C: EHLO localhost");
  respLines = await readSmtpResponse(tlsReader);
  console.log("S:", respLines.join("\nS: "));

  // QUIT
  await writeLine(tlsWriter, "QUIT");
  console.log("C: QUIT");
  respLines = await readSmtpResponse(tlsReader);
  console.log("S:", respLines.join("\nS: "));

  tlsConn.close();
}

if (Deno.args.length === 0) {
  console.error("Usage: deno run --allow-net script.ts <hostname>");
  Deno.exit(1);
}

smtpSubmissionTest();
