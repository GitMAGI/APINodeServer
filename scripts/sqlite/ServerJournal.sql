--
-- File generated with SQLiteStudio v3.2.1 on Thu Jan 17 15:28:02 2019
--
-- Text encoding used: System
--
PRAGMA foreign_keys = off;
BEGIN TRANSACTION;

-- Table: Request
CREATE TABLE Request (Id INTEGER PRIMARY KEY AUTOINCREMENT, OperationId TEXT NOT NULL, Timestamp TEXT NOT NULL, RemoteIP TEXT NOT NULL, RemoteProxyIP TEXT, RemotePort INTEGER NOT NULL, LocalIP TEXT NOT NULL, LocalPort TEXT NOT NULL, Protocol STRING NOT NULL, Verb TEXT NOT NULL, Path TEXT NOT NULL, Headers TEXT, Body TEXT);

-- Table: Response
CREATE TABLE Response (Id INTEGER PRIMARY KEY AUTOINCREMENT, OperationId TEXT NOT NULL, Timestamp TEXT NOT NULL, Status INTEGER NOT NULL, RemoteIP TEXT NOT NULL, RemotePort INTEGER NOT NULL, LocalIP TEXT NOT NULL, LocalPort TEXT NOT NULL, Headers TEXT, Body TEXT);

-- Table: Trace
CREATE TABLE Trace (Scope TEXT, ServerName TEXT, User TEXT, Severity INTEGER NOT NULL, SessionId TEXT, OperationId TEXT NOT NULL, Timestamp TEXT NOT NULL, Message TEXT NOT NULL, Data TEXT);

COMMIT TRANSACTION;
PRAGMA foreign_keys = on;
