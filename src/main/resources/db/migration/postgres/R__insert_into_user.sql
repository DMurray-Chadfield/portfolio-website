INSERT INTO user_t
(email, password_hash, name, tos_accepted)
VALUES
('august@crud.business', '\x2432612431322442492e54502f636c6d47594f6b4a7a57762f6378362e634a754b4f66594167303533414b6e7741664e714431683536486156687447', 'August Lilleas', true)
ON CONFLICT (email) DO UPDATE SET
password_hash = EXCLUDED.password_hash,
name = EXCLUDED.name,
tos_accepted = EXCLUDED.tos_accepted;
