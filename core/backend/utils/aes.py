import sys
from Crypto.Cipher import AES

KEY = b'1234567890abcdef'

def encrypt_email(email):
    cipher = AES.new(KEY, AES.MODE_EAX)
    ciphertext, tag = cipher.encrypt_and_digest(email.encode('utf-8'))
    print(ciphertext.hex())

if __name__ == "__main__":
    if len(sys.argv) > 1:
        encrypt_email(sys.argv[1])