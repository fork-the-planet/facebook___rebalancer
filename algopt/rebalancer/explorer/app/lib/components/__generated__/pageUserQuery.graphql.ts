/**
 * @generated SignedSource<<03cf2e470fe51a593b9e5a683ae75a65>>
 * @relayHash f87c27cbd9680a80379e2802365396e0
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID 33369988999280981

import { ConcreteRequest } from 'relay-runtime';
export type pageUserQuery$variables = Record<PropertyKey, never>;
export type pageUserQuery$data = {
  readonly viewer_intern_user: {
    readonly intern_user: {
      readonly name: string | null;
      readonly unixname: string | null;
    } | null;
  } | null;
};
export type pageUserQuery = {
  response: pageUserQuery$data;
  variables: pageUserQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "unixname",
  "storageKey": null
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "__typename",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "pageUserQuery",
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": null,
        "kind": "LinkedField",
        "name": "viewer_intern_user",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": null,
            "kind": "LinkedField",
            "name": "intern_user",
            "plural": false,
            "selections": [
              (v0/*: any*/),
              (v1/*: any*/)
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "pageUserQuery",
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": null,
        "kind": "LinkedField",
        "name": "viewer_intern_user",
        "plural": false,
        "selections": [
          (v2/*: any*/),
          {
            "alias": null,
            "args": null,
            "concreteType": null,
            "kind": "LinkedField",
            "name": "intern_user",
            "plural": false,
            "selections": [
              (v2/*: any*/),
              (v0/*: any*/),
              (v1/*: any*/),
              (v3/*: any*/)
            ],
            "storageKey": null
          },
          (v3/*: any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "id": "33369988999280981",
    "metadata": {},
    "name": "pageUserQuery",
    "operationKind": "query",
    "text": null
  }
};
})();

(node as any).hash = "19f3ee46e6da1b3d531fcdf0ee8840b2";

export default node;
