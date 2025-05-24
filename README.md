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
deno run --allow-net main.ts smtp.gmail.com      
Connecting to smtp.gmail.com:587...
220 smtp.gmail.com ESMTP 4fb4d7f45d1cf-6045b95d2d1sm540533a12.24 - gsmtp
EHLO localhost
250-smtp.gmail.com at your service, [2001:4c3c:2902:3500:5963:8228:f4cb:f91]
S250-SIZE 35882577
S250-8BITMIME
S250-STARTTLS
S250-ENHANCEDSTATUSCODES
S250-PIPELINING
S250-CHUNKING
S250 SMTPUTF8
STARTTLS
220 2.0.0 Ready to start TLS
EHLO localhost
250-smtp.gmail.com at your service, [2001:4c3c:2902:3500:5963:8228:f4cb:f91]
250-SIZE 35882577
250-8BITMIME
250-AUTH LOGIN PLAIN XOAUTH2 PLAIN-CLIENTTOKEN OAUTHBEARER XOAUTH
250-ENHANCEDSTATUSCODES
250-PIPELINING
250-CHUNKING
250 SMTPUTF8
QUIT
221 2.0.0 closing connection 4fb4d7f45d1cf-6045b95d2d1sm540533a12.24 - gsmtp
```
