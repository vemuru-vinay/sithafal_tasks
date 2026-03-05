from sqlalchemy import create_engine
import urllib.parse

def get_engine():
    user = "root"
    password = "Vinay@278"
    db_name = "sithafal_ai"
    host = "localhost"
    port = 3306

    encoded_password = urllib.parse.quote_plus(password)

    connection_url = f"mysql+pymysql://{user}:{encoded_password}@{host}:{port}/{db_name}"

    engine = create_engine(connection_url)
    return engine
