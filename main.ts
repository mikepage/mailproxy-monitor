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

      if (line.length >= 4) {
        const code = line.slice(0, 3);
        const delim = line[3];
        if (/^\d{3}$/.test(code) && delim === " ") {
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

async function smtpSubmissionTestImplicitTls(hostname: string, port: number) {
  console.log(`Connecting to ${hostname}:${port} with implicit TLS...`);
  const conn = await Deno.connect({ hostname, port });

  let tlsConn;
  try {
    tlsConn = await Deno.startTls(conn, { hostname });
  } catch (err) {
    console.error("TLS handshake failed:", err);
    conn.close();
    return;
  }

  const reader = tlsConn.readable.getReader();
  const writer = tlsConn.writable.getWriter();

  try {
    let resp = await readSmtpResponse(reader);
    console.log(resp.join("\n"));

    await writeLine(writer, "EHLO localhost");
    console.log("EHLO localhost");
    resp = await readSmtpResponse(reader);
    console.log(resp.join("\n"));

    await writeLine(writer, "QUIT");
    console.log("QUIT");
    resp = await readSmtpResponse(reader);
    console.log(resp.join("\n"));
  } catch (err) {
    console.error("SMTP conversation error:", err);
  } finally {
    reader.releaseLock();
    writer.releaseLock();
    tlsConn.close();
  }
}

async function smtpSubmissionTestStartTls(hostname: string, port: number) {
  console.log(`Connecting to ${hostname}:${port} with STARTTLS...`);
  const conn = await Deno.connect({ hostname, port });

  const reader = conn.readable.getReader();
  const writer = conn.writable.getWriter();

  try {
    // Greeting
    let resp = await readSmtpResponse(reader);
    console.log(resp.join("\n"));

    // EHLO
    await writeLine(writer, "EHLO localhost");
    console.log("EHLO localhost");
    resp = await readSmtpResponse(reader);
    console.log(resp.join("\n"));

    // STARTTLS command
    await writeLine(writer, "STARTTLS");
    console.log("STARTTLS");
    resp = await readSmtpResponse(reader);
    console.log(resp.join("\n"));

    if (!resp[0].startsWith("220")) {
      console.error("STARTTLS not supported or failed");
      conn.close();
      return;
    }

    // Release locks before TLS upgrade
    reader.releaseLock();
    writer.releaseLock();

    let tlsConn;
    try {
      tlsConn = await Deno.startTls(conn, { hostname });
    } catch (err) {
      console.error("TLS handshake failed:", err);
      conn.close();
      return;
    }

    const tlsReader = tlsConn.readable.getReader();
    const tlsWriter = tlsConn.writable.getWriter();

    // EHLO again after TLS
    await writeLine(tlsWriter, "EHLO localhost");
    console.log("EHLO localhost");
    resp = await readSmtpResponse(tlsReader);
    console.log(resp.join("\n"));

    // QUIT
    await writeLine(tlsWriter, "QUIT");
    console.log("QUIT");
    resp = await readSmtpResponse(tlsReader);
    console.log(resp.join("\n"));

    tlsReader.releaseLock();
    tlsWriter.releaseLock();
    tlsConn.close();
  } catch (err) {
    console.error("SMTP error:", err);
    conn.close();
  }
}

async function main() {
  if (Deno.args.length < 2) {
    console.error("Usage: deno run --allow-net main.ts <hostname> <port>");
    Deno.exit(1);
  }
  const hostname = Deno.args[0];
  const port = Number(Deno.args[1]);

  if (port === 465) {
    await smtpSubmissionTestImplicitTls(hostname, port);
  } else if (port === 587) {
    await smtpSubmissionTestStartTls(hostname, port);
  } else {
    console.error(
      `Unsupported port ${port}. Use 465 for implicit TLS or 587 for STARTTLS.`,
    );
    Deno.exit(1);
  }
}

main();
