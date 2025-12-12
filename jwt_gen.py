import secrets
import string

def generate_random_string(length=32):
  alphabet = string.ascii_letters + string.digits
  random_string = ''.join(secrets.choice(alphabet) for _ in range(length))
  return random_string

if __name__ == "__main__":
  my_string = generate_random_string(32)
  print(f"Generated 32-character string: {my_string}")
  print(f"Actual length: {len(my_string)}")