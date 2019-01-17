--
-- File generated with SQLiteStudio v3.2.1 on Thu Jan 17 17:10:45 2019
--
-- Text encoding used: System
--
PRAGMA foreign_keys = off;
BEGIN TRANSACTION;

-- Table: Account
CREATE TABLE Account (UserId TEXT PRIMARY KEY NOT NULL, Username TEXT NOT NULL UNIQUE, PasswordHASH TEXT NOT NULL, PasswordHASHAlgorithm TEXT NOT NULL, Email TEXT NOT NULL, EmailForRecovery TEXT NOT NULL, PasswordExpirationDate TEXT, Deleted INTEGER NOT NULL, Disabled INTEGER NOT NULL, ExpirationDate TEXT, UnlockingDate TEXT, CreationUser TEXT NOT NULL, CreationDate TEXT NOT NULL, LastModifiedUser TEXT NOT NULL, LastModifiedDate TEXT NOT NULL);

-- Table: Group
CREATE TABLE "Group" (GroupId TEXT PRIMARY KEY, GroupName TEXT NOT NULL UNIQUE, CreationUser TEXT NOT NULL, CreationDate TEXT NOT NULL, LastModifiedUser TEXT NOT NULL, LastModifiedDate TEXT NOT NULL);

-- Table: GroupMember
CREATE TABLE GroupMember (GroupId TEXT NOT NULL REFERENCES "Group" (GroupId), UserId TEXT NOT NULL REFERENCES Account (UserId), CreationUser TEXT NOT NULL, CreationDate TEXT NOT NULL, LastModifiedUser TEXT NOT NULL, LastModifiedDate TEXT NOT NULL, PRIMARY KEY (GroupId, UserId));

COMMIT TRANSACTION;
PRAGMA foreign_keys = on;
