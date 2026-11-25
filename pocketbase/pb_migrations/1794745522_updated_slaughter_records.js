/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_523158659")

  // add field
  collection.fields.addAt(35, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1156222427",
    "max": 0,
    "min": 0,
    "name": "remarks",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(36, new Field({
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
  const collection = app.findCollectionByNameOrId("pbc_523158659")

  // remove field
  collection.fields.removeById("text1156222427")

  // remove field
  collection.fields.removeById("text1130519967")

  return app.save(collection)
})
