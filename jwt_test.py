import jwt

secret = "django-insecure-7m4k_!)13r)lcs*1p2%2ta+#0z6$2#j(iytz9j6rp(#y9fc+#n"

# Create a mock token
token = jwt.encode({"user_id": "123e4567-e89b-12d3-a456-426614174000"}, secret, algorithm="HS256")

# Decode it
try:
    decoded = jwt.decode(token, secret, algorithms=["HS256"])
    print("Success! Decoded:", decoded)
except Exception as e:
    print("Failed!", e)
