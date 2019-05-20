# Orbit-db Table Store

> An orbit-db that allows you to create a table with indexed fields and retrieve them similarly to SQL.

Define a basic schema. Multiple columns can be indexed. All indexes are implemented as remotely-loaded [B-trees](https://github.com/mmalmi/merkle-btree/)

//TODO: This