/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1088669182")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\" && @request.auth.status = \"Approved\" && (@request.auth.role = \"Admin\" || @request.auth.section = \"ALL\")",
    "deleteRule": "@request.auth.id != \"\" && @request.auth.status = \"Approved\" && (@request.auth.role = \"Admin\" || @request.auth.section = \"ALL\")",
    "updateRule": "@request.auth.id != \"\" && @request.auth.status = \"Approved\" && (@request.auth.role = \"Admin\" || @request.auth.section = \"ALL\")"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1088669182")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\" && @request.auth.status = \"Approved\" && ((@request.auth.role = \"Admin\" || @request.auth.section = \"ALL\") || @request.auth.section = \"F\")",
    "deleteRule": "@request.auth.id != \"\" && @request.auth.status = \"Approved\" && ((@request.auth.role = \"Admin\" || @request.auth.section = \"ALL\") || @request.auth.section = \"F\")",
    "updateRule": "@request.auth.id != \"\" && @request.auth.status = \"Approved\" && ((@request.auth.role = \"Admin\" || @request.auth.section = \"ALL\") || @request.auth.section = \"F\")"
  }, collection)

  return app.save(collection)
})
