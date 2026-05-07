-- data.sql
INSERT INTO users (id, username, password, role) VALUES (1, 'donor1', 'pass', 'DONOR');
INSERT INTO profiles (id, blood_group, status, latitude, longitude, user_id) VALUES (1, 'O+', 'AVAILABLE', 12.9716, 77.5946, 1);

INSERT INTO users (id, username, password, role) VALUES (2, 'donor2', 'pass', 'DONOR');
INSERT INTO profiles (id, blood_group, status, latitude, longitude, user_id) VALUES (2, 'A+', 'AVAILABLE', 12.9352, 77.6245, 2);

INSERT INTO users (id, username, password, role) VALUES (3, 'donor3', 'pass', 'DONOR');
INSERT INTO profiles (id, blood_group, status, latitude, longitude, user_id) VALUES (3, 'B+', 'AVAILABLE', 12.9121, 77.6446, 3);

INSERT INTO users (id, username, password, role) VALUES (4, 'donor4', 'pass', 'DONOR');
INSERT INTO profiles (id, blood_group, status, latitude, longitude, user_id) VALUES (4, 'AB+', 'AVAILABLE', 12.9915, 77.5533, 4);

INSERT INTO users (id, username, password, role) VALUES (5, 'donor5', 'pass', 'DONOR');
INSERT INTO profiles (id, blood_group, status, latitude, longitude, user_id) VALUES (5, 'O-', 'AVAILABLE', 12.9592, 77.6974, 5);

INSERT INTO users (id, username, password, role) VALUES (6, 'donor6', 'pass', 'DONOR');
INSERT INTO profiles (id, blood_group, status, latitude, longitude, user_id) VALUES (6, 'A-', 'AVAILABLE', 12.8996, 77.4827, 6);

INSERT INTO users (id, username, password, role) VALUES (7, 'donor7', 'pass', 'DONOR');
INSERT INTO profiles (id, blood_group, status, latitude, longitude, user_id) VALUES (7, 'B-', 'AVAILABLE', 12.9279, 77.6271, 7);

INSERT INTO users (id, username, password, role) VALUES (8, 'donor8', 'pass', 'DONOR');
INSERT INTO profiles (id, blood_group, status, latitude, longitude, user_id) VALUES (8, 'AB-', 'AVAILABLE', 12.9784, 77.6408, 8);

INSERT INTO users (id, username, password, role) VALUES (9, 'donor9', 'pass', 'DONOR');
INSERT INTO profiles (id, blood_group, status, latitude, longitude, user_id) VALUES (9, 'O+', 'AVAILABLE', 12.8452, 77.6602, 9);

INSERT INTO users (id, username, password, role) VALUES (10, 'donor10', 'pass', 'DONOR');
INSERT INTO profiles (id, blood_group, status, latitude, longitude, user_id) VALUES (10, 'A+', 'AVAILABLE', 13.0068, 77.5816, 10);

-- Example Blood Bank
INSERT INTO users (id, username, password, role) VALUES (11, 'bank1', 'pass', 'BLOOD_BANK');
