# TODO execute sql script from py
import sqlite3 as db
try:
    con = db.connect('./db/main.db')
except:
    print("error connecting to database")

try:
    db_schema = open("./db/createdb.sql","r")   
except:
    print("error opening the schema file")
    
print("database created successfully")
cur = con.cursor()

if(cur.executescript(db_schema.read())):
    con.commit()
else:
    print("Error reading/ executing sql file")

con.close()
