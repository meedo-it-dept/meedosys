/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_267618074")

  // add field
  collection.fields.addAt(12, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text180472576",
    "max": 0,
    "min": 0,
    "name": "toda_id",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(13, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2000247085",
    "max": 0,
    "min": 0,
    "name": "ext_name",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(14, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text100804821",
    "max": 0,
    "min": 0,
    "name": "contact_number",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(15, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text512205686",
    "max": 0,
    "min": 0,
    "name": "id_expiry",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(16, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1130519967",
    "max": 0,
    "min": 0,
    "name": "updated_at",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_267618074")

  // remove field
  collection.fields.removeById("text180472576")

  // remove field
  collection.fields.removeById("text2000247085")

  // remove field
  collection.fields.removeById("text100804821")

  // remove field
  collection.fields.removeById("text512205686")

  // remove field
  collection.fields.removeById("text1130519967")

  return app.save(collection)
})
