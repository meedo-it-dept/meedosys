/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_681515208")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\" && @request.auth.status = \"Approved\"",
    "deleteRule": null,
    "listRule": "@request.auth.id != \"\" && @request.auth.status = \"Approved\" && (@request.auth.role = \"Admin\" || @request.auth.section = \"ALL\")",
    "updateRule": null,
    "viewRule": "@request.auth.id != \"\" && @request.auth.status = \"Approved\" && (@request.auth.role = \"Admin\" || @request.auth.section = \"ALL\")"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_681515208")

  // update collection data
  unmarshal({
    "createRule": "",
    "deleteRule": "",
    "listRule": "",
    "updateRule": "",
    "viewRule": ""
  }, collection)

  return app.save(collection)
})
