/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3879520690")

  // add field
  collection.fields.addAt(17, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text111645041",
    "max": 0,
    "min": 0,
    "name": "day_of_week",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(18, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2939768093",
    "max": 0,
    "min": 0,
    "name": "prep_title",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(19, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1432187382",
    "max": 0,
    "min": 0,
    "name": "ver_name",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(20, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2525033592",
    "max": 0,
    "min": 0,
    "name": "ver_title",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(21, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1527602086",
    "max": 0,
    "min": 0,
    "name": "app_name",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(22, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text4259706278",
    "max": 0,
    "min": 0,
    "name": "app_title",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(23, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2507189805",
    "max": 0,
    "min": 0,
    "name": "summary_activities",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(24, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text892881303",
    "max": 0,
    "min": 0,
    "name": "turnover_notes",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(25, new Field({
    "hidden": false,
    "id": "json1207928028",
    "maxSize": 0,
    "name": "incident_data",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  // add field
  collection.fields.addAt(26, new Field({
    "hidden": false,
    "id": "json572360306",
    "maxSize": 0,
    "name": "violations_data",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  // add field
  collection.fields.addAt(27, new Field({
    "hidden": false,
    "id": "json82771003",
    "maxSize": 0,
    "name": "lost_found_data",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  // add field
  collection.fields.addAt(28, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text604005327",
    "max": 0,
    "min": 0,
    "name": "locked_at",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3879520690")

  // remove field
  collection.fields.removeById("text111645041")

  // remove field
  collection.fields.removeById("text2939768093")

  // remove field
  collection.fields.removeById("text1432187382")

  // remove field
  collection.fields.removeById("text2525033592")

  // remove field
  collection.fields.removeById("text1527602086")

  // remove field
  collection.fields.removeById("text4259706278")

  // remove field
  collection.fields.removeById("text2507189805")

  // remove field
  collection.fields.removeById("text892881303")

  // remove field
  collection.fields.removeById("json1207928028")

  // remove field
  collection.fields.removeById("json572360306")

  // remove field
  collection.fields.removeById("json82771003")

  // remove field
  collection.fields.removeById("text604005327")

  return app.save(collection)
})
