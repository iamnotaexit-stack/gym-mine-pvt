ALTER TABLE members ADD CONSTRAINT valid_phone CHECK (length(regexp_replace(phone, '[^0-9]', '', 'g')) >= 10) NOT VALID;
