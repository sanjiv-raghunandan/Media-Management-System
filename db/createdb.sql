CREATE TABLE user (
    	user_ID integer PRIMARY KEY autoincrement,
    	Name varchar(255) NOT NULL,
    	email varchar(319) NOT NULL,
    	password varchar(255) NOT NULL,
	user_role varchar(255),
	created_at datetime NOT NULL,
	updated_at datetime
);

CREATE TABLE collection (
	collection_ID integer NOT NULL PRIMARY KEY autoincrement,
	name varchar(255) NOT NULL,
	description varchar(255),
	create_user_ID int ,
	last_updated timestamp,
	FOREIGN KEY (create_user_ID) REFERENCES user(user_ID)--added type here
);

CREATE TABLE media_categories (
	category_ID integer NOT NULL PRIMARY KEY autoincrement,
	name varchar(255) NOT NULL,
	description varchar(255),
	def_app varchar(255)
);

CREATE TABLE media (
	media_ID integer NOT NULL PRIMARY KEY autoincrement,
	title varchar(255) NOT NULL,
	description varchar(255),
	type varchar(255) NOT NULL,-- added type here
	url VARCHAR(2083) NOT NULL,
	size_kb int NOT NULL,
	duration int,
	resolution varchar(255),
	format varchar(255) NOT NULL,
	category_ID int ,
	upload_time timestamp NOT NULL,
	last_updated timestamp,
	collection_ID int ,
	FOREIGN KEY (category_ID) REFERENCES media_categories(category_ID), /* added types here*/
	FOREIGN KEY (collection_ID) REFERENCES collection(collection_ID)
);


CREATE TABLE user_preferences (
	user_preferences_ID integer NOT NULL PRIMARY KEY autoincrement,
	user_ID int NOT NULL,
	category_ID int NOT NULL,
	pref_app varchar(255),
	FOREIGN KEY (user_ID) REFERENCES user(user_ID),
	FOREIGN KEY (category_ID) REFERENCES media_categories(category_ID)
);


CREATE TABLE media_metadata (
	meta_id integer NOT NULL,
	media_id int ,
	data_type varchar(255),
	key varchar(255) NOT NULL,-- added type here
	value varchar(255) NOT NULL,
	FOREIGN KEY (media_id) REFERENCES media(media_id)
);

CREATE TRIGGER update_last_modified
AFTER UPDATE ON media
FOR EACH ROW
BEGIN
    -- Update the last_updated field to the current timestamp
    UPDATE media
    SET last_updated = CURRENT_TIMESTAMP
    WHERE media_id = OLD.media_id;
END;	

CREATE FUNCTION media_exists(media_id INT) 
RETURNS BOOLEAN
AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM media WHERE media_id = media_id);
END;
$$ LANGUAGE plpgsql;

CREATE PROCEDURE add_user_with_defaults(
    user_name VARCHAR(255),
    user_email VARCHAR(319),
    user_password VARCHAR(255),
    user_role VARCHAR(255)
)
BEGIN
    INSERT INTO user (Name, email, password, user_role, created_at)
    VALUES (user_name, user_email, user_password, user_role, CURRENT_TIMESTAMP);

    DECLARE new_user_id INT;
    SET new_user_id = LAST_INSERT_ID();

    INSERT INTO user_preferences (user_ID, category_ID, pref_app)
    SELECT new_user_id, category_ID, 'Default App'
    FROM media_categories;
END;

--JOIN
-- This query retrieves information about all media files and their associated metadata.
-- If a media file does not have metadata, it still appears in the results, but metadata fields will be NULL.
SELECT 
    m.media_ID,
    m.title,
    m.type,
    mm.key AS metadata_key,
    mm.value AS metadata_value
FROM media m
LEFT JOIN media_metadata mm ON m.media_ID = mm.media_ID;

--AGGREGATE FUNCTION QUERY
-- This query counts the number of media items for each type (e.g., video, audio) in the media table.
-- It groups the media by type and displays the count in descending order of the count.
SELECT 
    type,
    COUNT(*) AS media_count
FROM media
GROUP BY type
ORDER BY media_count DESC;

--NESTED QUERY
-- This query retrieves the media files with the largest file size within each category.
-- For each media file, it checks if its size matches the maximum size in its category using a subquery.
SELECT 
    m.media_ID,
    m.title,
    m.size_kb,
    m.category_ID
FROM media m
WHERE m.size_kb = (
    SELECT MAX(size_kb)
    FROM media
    WHERE category_ID = m.category_ID
);

