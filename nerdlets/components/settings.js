import React, { useCallback, useEffect, useState } from 'react';
import { Button, Form, HeadingText, TextField, Toast } from 'nr1';
import { FORM_TITLE } from '../shared/constants';
import { writeRemoteConfig } from '../shared/utils';

const Settings = ({ existingConfig, onClose, accountId, onConfigSaved }) => {
  const [parentGuid, setParentGuid] = useState('');
  const [groupTag, setGroupTag] = useState('');
  const [refreshRate, setRefreshRate] = useState('');
  const [headerTitle, setHeaderTitle] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingConfig) {
      setParentGuid(existingConfig.parentWorkloadGuid || '');
      setGroupTag(existingConfig.groupByTag || '');
      setRefreshRate(existingConfig.refreshRate || 60);
      setHeaderTitle(existingConfig.title || 'Leadership View');
    }
  }, [existingConfig]);

  const hasMissingRequiredFields = useCallback(() => {
    const missingParentGuid =
      !parentGuid || parentGuid.toString().trim() === '';
    const missingGroupTag = !groupTag || groupTag.toString().trim() === '';
    return missingParentGuid || missingGroupTag;
  }, [parentGuid, groupTag]);

  const submitForm = useCallback(async () => {
    if (hasMissingRequiredFields()) return;

    setSaving(true);
    try {
      let refreshSec;
      if (refreshRate && String(refreshRate).trim() !== '') {
        const n = Number(refreshRate);
        refreshSec = Number.isFinite(n) && n > 0 ? n : 60;
      } else if (existingConfig && existingConfig.refreshRate) {
        refreshSec = existingConfig.refreshRate;
      } else {
        refreshSec = 60; // default 60s
      }

      const title =
        headerTitle && String(headerTitle).trim() !== ''
          ? headerTitle
          : 'Leadership View';

      const newConfig = {
        ...(existingConfig || {}),
        parentWorkloadGuid: parentGuid,
        groupByTag: groupTag,
        refreshRate: refreshSec,
        title,
      };

      const result = await writeRemoteConfig(newConfig, accountId);
      if (result) {
        Toast.showToast({
          title: 'Settings saved successfully',
          type: Toast.TYPE.NORMAL,
        });
        // Inform parent of saved config so it can update state and re-render
        if (typeof onConfigSaved === 'function') onConfigSaved(newConfig);
        if (typeof onClose === 'function') onClose();
      } else {
        Toast.showToast({
          title: 'Settings failed to save',
          description:
            'Failed to save settings, check console for error details.',
          type: Toast.TYPE.CRITICAL,
        });
      }
    } catch (err) {
      Toast.showToast({
        title: 'Settings failed to save',
        description:
          'Failed to save settings, check console for error details.',
        type: Toast.TYPE.CRITICAL,
      });
      console.error('Error saving config', err);
    } finally {
      setSaving(false);
    }
  }, [
    parentGuid,
    groupTag,
    refreshRate,
    headerTitle,
    existingConfig,
    accountId,
    hasMissingRequiredFields,
    onClose,
    onConfigSaved,
  ]);

  return (
    <div>
      <HeadingText type={HeadingText.TYPE.HEADING_2}>{FORM_TITLE}</HeadingText>
      <Form>
        <TextField
          required
          invalid={!parentGuid}
          value={parentGuid}
          onChange={(e) => setParentGuid(e.target.value)}
          name="parentGuid"
          label="Parent Workload GUID"
          placeholder="MTQ4MjAzNnxOUj..."
        />
        <TextField
          required
          invalid={!groupTag}
          value={groupTag}
          onChange={(e) => setGroupTag(e.target.value)}
          name="groupTag"
          label="Tag to Group By"
          placeholder="e.g. team"
        />
        <TextField
          name="refreshRate"
          value={refreshRate}
          onChange={(e) => setRefreshRate(e.target.value)}
          label="Refresh Rate (seconds)"
          placeholder="e.g. 60"
        />
        <TextField
          name="headerTitle"
          value={headerTitle}
          onChange={(e) => setHeaderTitle(e.target.value)}
          label="Header Title"
          placeholder="e.g. Leadership View"
        />
        <div className="action-buttons">
          <Button
            style={{ marginRight: '16px' }}
            disabled={hasMissingRequiredFields() || saving}
            onClick={submitForm}
            variant={Button.VARIANT.PRIMARY}
            sizeType={Button.SIZE_TYPE.MEDIUM}
          >
            Save
          </Button>
          <Button
            onClick={onClose}
            disabled={!existingConfig || saving}
            variant={Button.VARIANT.DESTRUCTIVE}
            sizeType={Button.SIZE_TYPE.MEDIUM}
          >
            Cancel
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default Settings;
