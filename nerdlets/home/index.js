import React, { useEffect, useState } from 'react';
import { Button, EmptyState, Modal, nerdlet, Spinner } from 'nr1';
import Main from '../components/main';
import Settings from '../components/settings';
import config from '../shared/config.json';
import { fetchRemoteConfig, fetchUserPrefs } from '../shared/utils';
import {
  EMPTY_TITLE,
  EMPTY_DESCRIPTION,
  FORM_TITLE,
} from '../shared/constants';

// https://docs.newrelic.com/docs/new-relic-programmable-platform-introduction

const accountId = config?.configAccountId || 0;

const LeadershipNerdlet = () => {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(null);
  const [userPrefs, setUserPrefs] = useState(null);
  const [isSettingsHidden, setIsSettingsHidden] = useState(true);

  useEffect(() => {
    const fetchAndSetConfig = async () => {
      const remoteConfig = await fetchRemoteConfig(accountId);
      const userPrefs = await fetchUserPrefs();

      if (userPrefs) setUserPrefs(userPrefs);

      if (!remoteConfig || !accountId || accountId === 0) {
        nerdlet.setConfig({
          accountPicker: false,
          timePicker: false,
        });
        setLoading(false);
        return;
      }

      setConfig(remoteConfig);
      nerdlet.setConfig({
        headerTitle: remoteConfig?.title || 'Leadership View',
        accountPicker: false,
        timePicker: false,
      });
      setLoading(false);
    };

    fetchAndSetConfig();
  }, []);

  // Main component update handler
  const handlePrefsUpdated = (updatedPrefs) => {
    setUserPrefs(updatedPrefs);
  };

  // Settings save handler
  const handleConfigSaved = (updatedConfig) => {
    setConfig(updatedConfig);
    nerdlet.setConfig({
      headerTitle: updatedConfig?.title || 'Leadership View',
      accountPicker: false,
      timePicker: false,
    });
  };

  if (loading) return <Spinner />;

  // first time load
  if (!loading && !config) {
    return (
      <>
        <EmptyState
          iconType={EmptyState.ICON_TYPE.INTERFACE__OPERATIONS__CONFIGURE}
          title={EMPTY_TITLE}
          description={EMPTY_DESCRIPTION}
          additionalInfoLink={{
            label: 'See our docs',
            to: 'https://github.com/newrelic-experimental/nr1-leadership-view/edit/main/README.md#in-application-config',
          }}
          action={{
            label: 'Get Started',
            onClick: () => setIsSettingsHidden(false),
          }}
        />
        <Modal
          hidden={isSettingsHidden}
          onClose={() => setIsSettingsHidden(true)}
        >
          <Settings
            existingConfig={config}
            onClose={() => setIsSettingsHidden(true)}
            accountId={accountId}
            onConfigSaved={handleConfigSaved}
          />
        </Modal>
      </>
    );
  }

  return (
    <>
      <Button
        className="settings"
        variant={Button.VARIANT.PRIMARY}
        onClick={() => setIsSettingsHidden(false)}
        iconType={Button.ICON_TYPE.INTERFACE__OPERATIONS__CONFIGURE}
        ariaLabel="Settings"
      >
        {FORM_TITLE}
      </Button>
      <Main
        config={config}
        userPrefs={userPrefs}
        onPrefsUpdated={handlePrefsUpdated}
      />
      <Modal
        hidden={isSettingsHidden}
        onClose={() => setIsSettingsHidden(true)}
      >
        <Settings
          existingConfig={config}
          onClose={() => setIsSettingsHidden(true)}
          accountId={accountId}
          onConfigSaved={handleConfigSaved}
        />
      </Modal>
    </>
  );
};

export default LeadershipNerdlet;
