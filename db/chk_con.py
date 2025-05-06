import sqlite3 as mdb

def chk_conn(conn):
    try:
        conn.cursor()
        return True
    except Exception as ex:
        return False

myconn = mdb.connect('main.db')
if(chk_conn(myconn)):
    print("connected")
else:
    print("Not Connected")

cur = myconn.cursor()

res = cur.execute('SELECT * FROM sqlite_master')
print(res.fetchall())

