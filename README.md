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

## Example

```sh
deno run --allow-net main.ts "smtp.transip.email"
Connecting to smtp.transip.email:587...
220 submission8.mail.transip.nl ESMTP
EHLO localhost
250-submission8.mail.transip.nl
S250-PIPELINING
S250-SIZE 37033449
S250-STARTTLS
S250-ENHANCEDSTATUSCODES
S250-8BITMIME
S250-DSN
S250 CHUNKING
STARTTLS
220 2.0.0 Ready to start TLS
EHLO localhost
250-submission8.mail.transip.nl
250-PIPELINING
250-SIZE 37033449
250-AUTH PLAIN LOGIN
250-AUTH=PLAIN LOGIN
250-ENHANCEDSTATUSCODES
250-8BITMIME
250-DSN
250 CHUNKING
QUIT
221 2.0.0 Bye
```
