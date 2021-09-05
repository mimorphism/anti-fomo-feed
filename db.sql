CREATE DATABASE antifomofeed

CREATE TABLE links
(
    link_id SERIAL PRIMARY KEY,
    link VARCHAR(500),
    is_viewed BOOLEAN,
    saved_for_later BOOLEAN
)