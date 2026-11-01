# hugs-bot (v2!)

a slack bot that brings the love 💖

- one command, `/give-hug`
- send virtual hugs to people
- send virtual hugs back to people
- see who sent people hugs
- see who sent the most hugs on a leaderboard


<img width="192" height="64" alt="An animation of two clipart cats hugging." src="https://github.com/user-attachments/assets/aa4a6fce-5c89-42a4-b04d-cfbad43ff48b" />
<p><sup>cute animation!</sup></p>

<img width="753" height="540" alt="An animated GIF of a user sending a virtual hug." src="https://github.com/user-attachments/assets/a59f886f-0471-4c70-90dc-2ce0f5cf4450" />

## development

```bash
bun install
# and then...
bun dev
```

### forwarding

the api can also forward requests to another server from production. this allows you to iterate and test features without creating a separate slack bot and configuration.

make sure your dev server is publicly accessible (for example, using [ngrok](https://ngrok.com/) or [cloudflare tunnels](https://try.cloudflare.com/)), then add the following variables to your .env:

```env
# [development and production]
FORWARD_SECRET="some-secure-password"                     # you should generate this!

# [development only]
PRODUCTION_URL="https://example.com"                      # domain of your production app
FORWARD_TO="https://your-dev-server.ngrok.io/api/events"  # url to forward slack events to
FORWARD_UIDS="UABCDE12345,UFGHIJ67890"                    # comma-separated list of slack user ids
```
