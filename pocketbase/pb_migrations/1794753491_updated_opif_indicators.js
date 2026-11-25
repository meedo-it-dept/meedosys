/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1244961316")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\" && @request.auth.status = \"Approved\" && (@request.auth.role = \"Admin\" || @request.auth.section = \"ALL\")",
    "deleteRule": "@request.auth.id != \"\" && @request.auth.status = \"Approved\" && (@request.auth.role = \"Admin\" || @request.auth.section = \"ALL\")",
    "listRule": "@request.auth.id != \"\" && @request.auth.status = \"Approved\" && ((@request.auth.role = \"Admin\" || @request.auth.section = \"ALL\") || section = @request.auth.section)",
    "updateRule": "@request.auth.id != \"\" && @request.auth.status = \"Approved\" && ((@request.auth.role = \"Admin\" || @request.auth.section = \"ALL\") || section = @request.auth.section)",
    "viewRule": "@request.auth.id != \"\" && @request.auth.status = \"Approved\" && ((@request.auth.role = \"Admin\" || @request.auth.section = \"ALL\") || section = @request.auth.section)"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1244961316")

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
