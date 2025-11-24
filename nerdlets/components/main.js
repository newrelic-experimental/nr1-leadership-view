import React, { useState, useEffect } from 'react';
import { EmptyState, navigation, Spinner, TextField } from 'nr1';
import { Accordion, Button, Icon } from 'semantic-ui-react';
import {
  fetchWorkloadStatus,
  formatGroups,
  getColor,
  writeUserPrefs,
} from '../shared/utils';
import { ERROR } from '../shared/constants';

const Main = ({ config, userPrefs, onPrefsUpdated }) => {
  const [activeIndex, setActiveIndex] = useState(-1); // eslint-disable-line no-unused-vars
  const [loading, setLoading] = useState(true);
  const [workloads, setWorkloads] = useState([]);
  const [groups, setGroups] = useState([]);
  const [editingGroupIdx, setEditingGroupIdx] = useState(null);
  const [editingValue, setEditingValue] = useState('');

  useEffect(() => {
    const fetchAndSetWorkloads = async () => {
      const wkloads = await fetchWorkloadStatus(
        config.parentWorkloadGuid,
        null
      );

      if (wkloads == null) {
        setLoading(false);
        return;
      }

      const workloadGroups = await formatGroups(
        wkloads,
        config.groupByTag,
        userPrefs
      );
      setWorkloads(wkloads);
      setGroups(workloadGroups);
      setLoading(false);
    };

    fetchAndSetWorkloads();

    const intervalId = setInterval(
      fetchAndSetWorkloads,
      config.refreshRate * 1000 || 60000
    );
    return () => clearInterval(intervalId);
  }, [config, userPrefs]);

  const handleSave = async () => {
    const g = groups[editingGroupIdx];
    if (!g) return;

    const newPref = {
      actualTag: g.groupTag,
      alias: editingValue,
      index: g.index,
    };

    try {
      const saved = await writeUserPrefs(newPref, userPrefs);

      if (saved && saved.groups) {
        // Update parent state
        if (typeof onPrefsUpdated === 'function') onPrefsUpdated(saved);
        // Rebuild local groups from workloads with new prefs
        const rebuilt = formatGroups(workloads, config.groupByTag, saved);
        setGroups(rebuilt);
      } else {
        // Fallback: update local state
        setGroups((prev, i) =>
          prev.map((group, idx) =>
            idx === i
              ? {
                  ...group,
                  actualTag: g.groupTag,
                  alias: editingValue,
                  index: g.index,
                }
              : group
          )
        );
      }
    } catch (err) {
      console.error('Error saving pref', err);
    } finally {
      setEditingGroupIdx(null);
      setEditingValue('');
    }
  };

  if (loading && (workloads.length === 0 || !groups.length)) {
    return (
      <div style={{ textAlign: 'center' }}>
        <h4>Loading</h4>
        <Spinner type={Spinner.TYPE.DOT} />
      </div>
    );
  }

  if (!loading && (workloads.length === 0 || !groups.length)) {
    return (
      <EmptyState
        type={EmptyState.TYPE.ERROR}
        iconType={
          EmptyState.ICON_TYPE
            .HARDWARE_AND_SOFTWARE__SOFTWARE__DATABASE__S_ERROR
        }
        title={ERROR.TITLE}
        description={ERROR.DESCRIPTION}
        additionalInfoLink={{
          label: ERROR.LINK_LABEL,
          to: ERROR.LINK_URI,
        }}
      />
    );
  }

  return (
    <>
      {groups.map((g, i) => {
        const isEditing = editingGroupIdx === i;
        // Use alias if present and non-empty, else actualTag
        const displayTag =
          g.alias && g.alias.trim() !== ''
            ? g.alias
            : g.actualTag || g.groupTag;
        return (
          <Accordion fluid styled key={g.groupTag}>
            <Accordion.Title active={activeIndex === 0} index={i}>
              <div className="group-header">
                {isEditing ? (
                  <>
                    <TextField
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      style={{ fontSize: '1.5em', marginRight: 8 }}
                    />
                    <Button
                      size="small"
                      icon="save outline"
                      primary
                      onClick={() => handleSave()}
                    />
                    <Button
                      size="small"
                      icon="cancel"
                      negative
                      onClick={() => {
                        setEditingGroupIdx(null);
                        setEditingValue('');
                      }}
                    />
                  </>
                ) : (
                  <>
                    <h2 style={{ margin: 0 }}>{displayTag}</h2>
                    <Icon
                      className="edit-icon"
                      name="edit outline"
                      onClick={() => {
                        setEditingGroupIdx(i);
                        setEditingValue(
                          g.alias && g.alias.trim() !== ''
                            ? g.alias
                            : g.actualTag || g.groupTag
                        );
                      }}
                    />
                  </>
                )}
              </div>
            </Accordion.Title>
            <Accordion.Content active={activeIndex}>
              {g.data.map((wl, i) => {
                return (
                  <Button
                    key={i}
                    onClick={() =>
                      navigation.openStackedEntity(wl.target.entity.guid)
                    }
                    size="big"
                    style={{ marginBottom: '5px' }}
                    color={getColor(wl.target.entity.alertSeverity)}
                  >
                    {wl.target.entity.name}
                  </Button>
                );
              })}
            </Accordion.Content>
          </Accordion>
        );
      })}
    </>
  );
};

export default Main;
