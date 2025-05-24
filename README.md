# SMTP Submission Test Tool (Deno)

A simple SMTP submission client implemented in Deno.  
It connects to an SMTP server on port 587, performs the SMTP handshake, upgrades to TLS via STARTTLS, re-issues EHLO, and then quits.

---

## Features

- Connects to any SMTP server on port 587.
- Reads and displays SMTP server greeting.
- Sends EHLO command and parses multiline responses.
- Sends STARTTLS command to upgrade connection to TLS.
- Sends EHLO again after TLS upgrade.
- Sends QUIT to terminate the session.
- Handles SMTP multiline responses properly.
- Logs all client commands and server responses.
- Handles TLS handshake errors gracefully.

---

## Requirements

- [Deno](https://deno.land/) runtime (tested with Deno 1.30+)
- Network access to the SMTP server on port 587.

---

## Usage

```sh
deno run --allow-net main.ts <hostname>
```
