import asyncio
import json
import os
from datetime import timezone
from typing import Optional, Set

import httpx
from dotenv import load_dotenv
from telethon import TelegramClient, events
from telethon.sessions import StringSession

load_dotenv()

API_ID = int(os.getenv("TELEGRAM_API_ID", "0") or "0")
API_HASH = os.getenv("TELEGRAM_API_HASH", "")
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")  # opcional
N8N_WEBHOOK_URL = os.getenv("N8N_WEBHOOK_URL", "").strip()

# Controle de chats permitidos: "*" (todos) ou lista de IDs separadas por vírgula
allow_chats_env = os.getenv("ALLOW_CHATS", "*").strip()
ALLOW_CHATS: Optional[Set[int]] = None
if allow_chats_env != "*":
    ids = []
    for part in allow_chats_env.split(","):
        part = part.strip()
        if not part:
            continue
        try:
            ids.append(int(part))
        except ValueError:
            print(f"[WARN] ID inválido em ALLOW_CHATS: {part}")
    ALLOW_CHATS = set(ids)

# Encaminhar mídia pequena?
FORWARD_MEDIA = (os.getenv("FORWARD_MEDIA", "true").lower() == "true")
MAX_MEDIA_BYTES = 8 * 1024 * 1024  # 8 MB

if not API_ID or not API_HASH or not N8N_WEBHOOK_URL:
    raise SystemExit("Defina TELEGRAM_API_ID, TELEGRAM_API_HASH e N8N_WEBHOOK_URL no .env")

# Armazenar sessão no disco (pasta ./session)
session_dir = os.path.join(os.getcwd(), "session")
os.makedirs(session_dir, exist_ok=True)
session_path = os.path.join(session_dir, "tg.session")

client = TelegramClient(session_path, API_ID, API_HASH)

async def start_client():
    if BOT_TOKEN:
        await client.start(bot_token=BOT_TOKEN)
        print("[INFO] Rodando como BOT.")
    else:
        # Conta de usuário: pedirá login no primeiro run
        await client.start()
        print("[INFO] Rodando como CONTA DE USUÁRIO.")

def chat_allowed(chat_id: Optional[int]) -> bool:
    if chat_id is None:
        return True  # mensagens de canais sem chat_id explícito
    if ALLOW_CHATS is None:
        return True  # '*' (todos permitidos)
    return chat_id in ALLOW_CHATS

async def send_to_n8n(payload: dict, media_bytes: bytes | None = None, media_name: str | None = None):
    timeout = httpx.Timeout(15.0, connect=10.0)
    async with httpx.AsyncClient(timeout=timeout) as http:
        if media_bytes and FORWARD_MEDIA:
            files = {'file': (media_name or 'file', media_bytes)}
            data = {'payload': json.dumps(payload, ensure_ascii=False)}
            resp = await http.post(N8N_WEBHOOK_URL, data=data, files=files)
        else:
            resp = await http.post(N8N_WEBHOOK_URL, json=payload)
        resp.raise_for_status()
        return resp

@client.on(events.NewMessage(incoming=True))
async def handler(event: events.NewMessage.Event):
    msg = event.message
    chat = await event.get_chat()
    sender = await event.get_sender()

    # Extração de campos úteis
    chat_id = getattr(chat, 'id', None)
    chat_type = getattr(chat, '__class__', type('X', (), {}))
    chat_type_name = getattr(chat_type, '__name__', 'Unknown')

    sender_id = getattr(sender, 'id', None)
    sender_username = getattr(sender, 'username', None)

    if not chat_allowed(chat_id):
        return  # filtrado

    text = msg.message or None
    date_iso = msg.date.astimezone(timezone.utc).isoformat()

    base_payload = {
        "message_id": msg.id,
        "date": date_iso,
        "chat_id": chat_id,
        "chat_type": chat_type_name.lower(),
        "sender_id": sender_id,
        "sender_username": sender_username,
        "text": text,
        "has_media": bool(msg.media),
        "raw": {
            "reply_to_msg_id": getattr(msg, "reply_to_msg_id", None),
            "fwd_from": bool(msg.fwd_from),
            "via_bot_id": getattr(msg, "via_bot_id", None),
            "entities": [str(e) for e in (msg.entities or [])],
        },
    }

    media_bytes = None
    media_name = None
    if FORWARD_MEDIA and msg.media:
        try:
            # baixa em memória, respeitando limite
            media_bytes = await client.download_media(msg, bytes)
            if isinstance(media_bytes, (bytes, bytearray)) and len(media_bytes) <= MAX_MEDIA_BYTES:
                media_name = "media"
            else:
                media_bytes = None  # muito grande
        except Exception as e:
            print(f"[WARN] Falha ao baixar mídia: {e}")

    try:
        resp = await send_to_n8n(base_payload, media_bytes=media_bytes, media_name=media_name)
        print(f"[OK] Enviado ao n8n (status {resp.status_code})")
    except httpx.HTTPError as e:
        print(f"[ERRO] Falha ao enviar ao n8n: {e}")

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(start_client())
    print("[READY] Escutando mensagens…")
    client.run_until_disconnected()