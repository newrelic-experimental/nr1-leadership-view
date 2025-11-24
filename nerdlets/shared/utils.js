import {
  NerdGraphQuery,
  AccountStorageQuery,
  AccountStorageMutation,
  UserStorageQuery,
  UserStorageMutation,
} from 'nr1';
import { STORAGE } from './constants';
import _ from 'lodash';

export const fetchWorkloadStatus = async (guid, cursor) => {
  let gql = ``;

  if (cursor === null) {
    gql = `
          {
          actor {
            entity(guid: "${guid}") {
              relatedEntities {
                nextCursor
                results {
                  target {
                    accountId
                    entity {
                      tags {
                        key
                        values
                      }
                      alertSeverity
                      account {
                        id
                        name
                      }
                      name
                      guid
                      type
                      permalink
                    }
                  }
                }
              }
            }
          }
        }
    `;
  } else {
    gql = `
          {
          actor {
            entity(guid: "${guid}") {
              relatedEntities(cursor: "${cursor}") {
                nextCursor
                results {
                  target {
                    accountId
                    entity {
                      tags {
                        key
                        values
                      }
                      alertSeverity
                      account {
                        id
                        name
                      }
                      name
                      guid
                      type
                      permalink
                    }
                  }
                }
              }
            }
          }
        }
    `;
  }

  const data = await NerdGraphQuery.query({
    query: gql,
  });

  if (data.error) {
    console.debug(`Error fetching workloads`, data.error);
    return null;
  }

  let workloads = data?.data?.actor?.entity?.relatedEntities?.results;
  let nextCursor = data?.data?.actor?.entity?.relatedEntities?.nextCursor;

  if (nextCursor == null) {
    return workloads;
  } else {
    const next = await fetchWorkloadStatus(guid, nextCursor);
    return workloads.concat(next);
  }
};

export const fetchRemoteConfig = async (accountId) => {
  const collection = STORAGE.ACCOUNT_CONFIG_COLLECTION; //TODO: move to constants
  const documentId = STORAGE.ACCOUNT_CONFIG_COLLECTION;

  const { error, data } = await AccountStorageQuery.query({
    accountId,
    collection,
    documentId,
  });

  if (error) {
    console.error(`Error fetching remote config ${error}`);
    return null;
  }

  return data;
};

export const writeRemoteConfig = async (config, accountId) => {
  const collection = STORAGE.ACCOUNT_CONFIG_COLLECTION; //TODO: move to constants
  const documentId = STORAGE.ACCOUNT_CONFIG_DOC_ID;

  const { error } = await AccountStorageMutation.mutate({
    accountId,
    actionType: AccountStorageMutation.ACTION_TYPE.WRITE_DOCUMENT,
    collection,
    documentId,
    document: config,
  });

  if (error) {
    console.error(`Error writing remote config: ${error}`);
    return false;
  }

  return true;
};

export const fetchUserPrefs = async () => {
  const collection = STORAGE.USER_CONFIG_COLLECTION; //TODO: move to constants
  const documentId = STORAGE.USER_CONFIG_DOC_ID;

  const { error, data } = await UserStorageQuery.query({
    collection,
    documentId,
  });

  if (error) {
    console.error(`Error fetching user preferences: ${error}`);
    return null;
  }

  if (!data || data.length === 0) {
    return null;
  }

  return data;
};

export const writeUserPrefs = async (newPref, existingPrefs) => {
  const collection = STORAGE.USER_CONFIG_COLLECTION; //TODO: move to constants
  const documentId = STORAGE.USER_CONFIG_DOC_ID;
  const currentGroups = existingPrefs?.groups || [];

  // Find if we already have a preference for this tag
  const existingPrefIndex = currentGroups.findIndex(
    (pref) => pref.actualTag === newPref.actualTag
  );

  // Create new array, either updating existing or adding new
  const updatedGroups =
    existingPrefIndex >= 0
      ? currentGroups.map((pref, idx) =>
          idx === existingPrefIndex ? newPref : pref
        )
      : [...currentGroups, newPref];

  const { error } = await UserStorageMutation.mutate({
    actionType: UserStorageMutation.ACTION_TYPE.WRITE_DOCUMENT,
    collection,
    documentId,
    document: {
      groups: updatedGroups,
    },
  });

  if (error) {
    console.error(`Error writing user preferences: ${error}`);
    return false;
  }

  return { groups: updatedGroups };
};

export const formatGroups = (
  workloads,
  groupByTag,
  userPrefs = { groups: [] }
) => {
  // Ensure we always have a groups array even if userPrefs is undefined
  const preferences = userPrefs || { groups: [] };

  let group = {};

  workloads.forEach((w) => {
    const groupTagValue = w.target.entity.tags.find(
      (tag) => tag.key === groupByTag
    );
    if (groupTagValue) {
      const value = groupTagValue.values[0];
      if (!group[value]) {
        group[value] = [];
      }
      group[value].push(w);
    }
  });

  const result = Object.entries(group).map(([groupTag, objects], idx) => {
    // Look for existing preference by actualTag in the groups array
    const existingPref = preferences.groups.find(
      (pref) => pref.actualTag === groupTag
    );
    return {
      groupTag,
      alias: existingPref?.alias || null,
      // Preserve existing index if found, otherwise use current idx
      index: existingPref?.index ?? idx,
      data: _.sortBy(objects, [(obj) => obj.target.entity.name.toLowerCase()]),
    };
  });

  const sortedResult = _.sortBy(result, ['groupTag', 'index']);

  return sortedResult;
};

export const getColor = (status) => {
  switch (status) {
    case 'CRITICAL':
      return 'red';
    case 'NOT_ALERTING':
      return 'green';
    case 'WARNING':
      return 'yellow';
    case 'NOT_CONFIGURED':
      return 'grey';
    default:
      return 'green';
  }
};
