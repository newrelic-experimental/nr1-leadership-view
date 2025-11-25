export const EMPTY_TITLE = 'No existing configuration found';
export const EMPTY_DESCRIPTION =
  'To get started, click the button below, fill out the form and click save!';
export const FORM_TITLE = 'Settings';
export const TOOLTIPS = {
  PARENT_WORKLOAD_GUID:
    'Entity guid of parent workload containing tagged, child workloads',
  TAG_GROUP:
    'Tag to group workloads by. This should exist on all workloads attached to the parent workload',
  REFRESH_RATE:
    'Time (in seconds) in which the view will be refreshed. Defaults to 60 seconds if undefined',
  HEADER: 'Title of view. Defaults to `Leadership View` if undefined',
};
export const ERROR = {
  TITLE: 'Error fetching data',
  DESCRIPTION:
    'Validate configuration inputs (parent workload guid, tag). If the issue persists, open an issue in the application Github repository.',
  LINK_LABEL: 'Github issues',
  LINK_URI:
    'https://github.com/newrelic-experimental/nr1-leadership-view/issues',
};

export const STORAGE = {
  ACCOUNT_CONFIG_COLLECTION: 'leadership-view-v1',
  ACCOUNT_CONFIG_DOC_ID: 'leadership-doc-v1',
  USER_CONFIG_COLLECTION: 'user-prefs-v1',
  USER_CONFIG_DOC_ID: 'user-prefs-doc-v1',
};
