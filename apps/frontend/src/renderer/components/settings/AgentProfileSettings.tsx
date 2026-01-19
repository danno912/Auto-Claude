import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Brain, Scale, Zap, Check, Sparkles, ChevronDown, ChevronUp, RotateCcw, Settings2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  DEFAULT_AGENT_PROFILES,
  AVAILABLE_MODELS,
  THINKING_LEVELS,
  DEFAULT_PHASE_MODELS,
  DEFAULT_PHASE_THINKING
} from '../../../shared/constants';
import { SettingsSection } from './SettingsSection';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import type { AppSettings, AgentProfile, PhaseModelConfig, PhaseThinkingConfig, ModelTypeShort, ThinkingLevel } from '../../../shared/types/settings';
import type { PhaseApiProfileConfig } from '../../../shared/types';
import type { APIProfile } from '@shared/types/profile';

/**
 * Icon mapping for agent profile icons
 */
const iconMap: Record<string, React.ElementType> = {
  Brain,
  Scale,
  Zap,
  Sparkles,
  Settings2
};

const PHASE_KEYS: Array<keyof PhaseModelConfig> = ['spec', 'planning', 'coding', 'qa'];
const MODEL_VALUES = new Set(AVAILABLE_MODELS.map((model) => model.value));
const THINKING_VALUES = new Set(THINKING_LEVELS.map((level) => level.value));

/**
 * Agent Profile Settings component
 * Displays preset agent profiles for quick model/thinking level configuration
 * All presets show phase configuration for full customization
 */
interface AgentProfileSettingsProps {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}

export function AgentProfileSettings({ settings, onSettingsChange }: AgentProfileSettingsProps) {
  const { t } = useTranslation('settings');
  const selectedProfileId = settings.selectedAgentProfile || 'auto';
  const selectedProfile = useMemo(
    () => DEFAULT_AGENT_PROFILES.find(p => p.id === selectedProfileId) || DEFAULT_AGENT_PROFILES[0],
    [selectedProfileId]
  );
  const [showPhaseConfig, setShowPhaseConfig] = useState(true);
  const [apiProfiles, setApiProfiles] = useState<APIProfile[]>([]);
  const [activeApiProfileId, setActiveApiProfileId] = useState<string | null>(null);

  const profilePhaseModels = selectedProfile.phaseModels || DEFAULT_PHASE_MODELS;
  const profilePhaseThinking = selectedProfile.phaseThinking || DEFAULT_PHASE_THINKING;
  const currentPhaseModels: PhaseModelConfig = useMemo(
    () => ({ ...profilePhaseModels, ...(settings.customPhaseModels || {}) }),
    [profilePhaseModels, settings.customPhaseModels]
  );
  const currentPhaseThinking: PhaseThinkingConfig = useMemo(
    () => ({ ...profilePhaseThinking, ...(settings.customPhaseThinking || {}) }),
    [profilePhaseThinking, settings.customPhaseThinking]
  );
  const currentPhaseApiProfiles: PhaseApiProfileConfig = useMemo(
    () => settings.customPhaseApiProfiles || {},
    [settings.customPhaseApiProfiles]
  );
  const defaultProfileValue = 'default';
  const hasApiProfiles = apiProfiles.length > 0;
  const apiProfileIds = useMemo(() => new Set(apiProfiles.map((profile) => profile.id)), [apiProfiles]);

  const hasCustomConfig = useMemo((): boolean => {
    if (!settings.customPhaseModels && !settings.customPhaseThinking) {
      return false;
    }
    return PHASE_KEYS.some(
      phase =>
        currentPhaseModels[phase] !== profilePhaseModels[phase] ||
        currentPhaseThinking[phase] !== profilePhaseThinking[phase]
    );
  }, [settings.customPhaseModels, settings.customPhaseThinking, currentPhaseModels, currentPhaseThinking, profilePhaseModels, profilePhaseThinking]);

  const getModelLabel = (modelValue: string): string => {
    const model = AVAILABLE_MODELS.find((m) => m.value === modelValue);
    return model?.label || modelValue;
  };

  const getThinkingLabel = (thinkingValue: string): string => {
    const level = THINKING_LEVELS.find((l) => l.value === thinkingValue);
    return level?.label || thinkingValue;
  };

  const renderProfileCard = (profile: AgentProfile) => {
    const isSelected = selectedProfileId === profile.id;
    const Icon = iconMap[profile.icon || 'Brain'] || Brain;

    return (
      <button
        key={profile.id}
        onClick={() => onSettingsChange({ ...settings, selectedAgentProfile: profile.id })}
        className={cn(
          'relative w-full rounded-lg border p-4 text-left transition-all duration-200',
          'hover:border-primary/50 hover:shadow-sm',
          isSelected
            ? 'border-primary bg-primary/5'
            : 'border-border bg-card'
        )}
      >
        {isSelected && (
          <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
            <Check className="h-3 w-3 text-primary-foreground" />
          </div>
        )}

        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg shrink-0',
              isSelected ? 'bg-primary/10' : 'bg-muted'
            )}
          >
            <Icon
              className={cn(
                'h-5 w-5',
                isSelected ? 'text-primary' : 'text-muted-foreground'
              )}
            />
          </div>

          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm text-foreground">{profile.name}</h3>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
              {profile.description}
            </p>

            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {getModelLabel(profile.model)}
              </span>
              <span className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {getThinkingLabel(profile.thinkingLevel)} {t('agentProfile.thinking')}
              </span>
            </div>
          </div>
        </div>
      </button>
    );
  };

  const handlePhaseModelChange = (phase: keyof PhaseModelConfig, value: ModelTypeShort) => {
    if (currentPhaseModels[phase] === value) {
      return;
    }
    const newPhaseModels = { ...currentPhaseModels, [phase]: value };
    onSettingsChange({ ...settings, customPhaseModels: newPhaseModels });
  };

  const handlePhaseThinkingChange = (phase: keyof PhaseThinkingConfig, value: ThinkingLevel) => {
    if (currentPhaseThinking[phase] === value) {
      return;
    }
    const newPhaseThinking = { ...currentPhaseThinking, [phase]: value };
    onSettingsChange({ ...settings, customPhaseThinking: newPhaseThinking });
  };

  const handleResetToProfileDefaults = () => {
    onSettingsChange({
      ...settings,
      customPhaseModels: undefined,
      customPhaseThinking: undefined
    });
  };

  const handlePhaseApiProfileChange = (phase: keyof PhaseApiProfileConfig, value: string) => {
    const normalizedValue = value === defaultProfileValue ? undefined : value;
    if (currentPhaseApiProfiles[phase] === normalizedValue) {
      return;
    }
    const nextProfiles = { ...currentPhaseApiProfiles };
    if (normalizedValue) {
      nextProfiles[phase] = normalizedValue;
    } else {
      delete nextProfiles[phase];
    }
    const hasOverrides = Object.values(nextProfiles).some(Boolean);
    onSettingsChange({
      ...settings,
      customPhaseApiProfiles: hasOverrides ? nextProfiles : undefined
    });
  };

  useEffect(() => {
    let isMounted = true;
    window.electronAPI
      .getAPIProfiles()
      .then((result: { success: boolean; data?: { profiles: APIProfile[]; activeProfileId: string | null } }) => {
        if (!isMounted || !result.success || !result.data) {
          return;
        }
        setApiProfiles(result.data.profiles);
        setActiveApiProfileId(result.data.activeProfileId);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);


  return (
    <SettingsSection
      title={t('agentProfile.title')}
      description={t('agentProfile.sectionDescription')}
    >
      <div className="space-y-4">
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">
            {t('agentProfile.profilesInfo')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {DEFAULT_AGENT_PROFILES.map(renderProfileCard)}
        </div>

        <div className="mt-6 rounded-lg border border-border bg-card">
          <button
            type="button"
            onClick={() => setShowPhaseConfig(!showPhaseConfig)}
            className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors rounded-t-lg"
          >
            <div>
              <h4 className="font-medium text-sm text-foreground">{t('agentProfile.phaseConfiguration')}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('agentProfile.phaseConfigurationDescription')}
              </p>
            </div>
            {showPhaseConfig ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {showPhaseConfig && (
            <div className="border-t border-border p-4 space-y-4">
              {hasCustomConfig && (
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetToProfileDefaults}
                    className="text-xs h-7"
                  >
                    <RotateCcw className="h-3 w-3 mr-1.5" />
                    {t('agentProfile.resetToProfileDefaults', { profile: selectedProfile.name })}
                  </Button>
                </div>
              )}

              <div className="space-y-4">
                {PHASE_KEYS.map((phase) => (
                  <div key={phase} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-foreground">
                        {t(`agentProfile.phases.${phase}.label`)}
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        {t(`agentProfile.phases.${phase}.description`)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">{t('agentProfile.model')}</Label>
                        <select
                          className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground"
                          value={currentPhaseModels[phase]}
                          onChange={(event) => handlePhaseModelChange(phase, event.target.value as ModelTypeShort)}
                        >
                          {AVAILABLE_MODELS.map((m) => (
                            <option key={m.value} value={m.value}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">{t('agentProfile.thinkingLevel')}</Label>
                        <select
                          className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground"
                          value={currentPhaseThinking[phase]}
                          onChange={(event) => handlePhaseThinkingChange(phase, event.target.value as ThinkingLevel)}
                        >
                          {THINKING_LEVELS.map((level) => (
                            <option key={level.value} value={level.value}>
                              {level.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-muted-foreground mt-4 pt-3 border-t border-border">
                {t('agentProfile.phaseConfigNote')}
              </p>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="p-4">
            <h4 className="font-medium text-sm text-foreground">{t('agentProfile.apiProfiles.title')}</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('agentProfile.apiProfiles.description')}
            </p>
          </div>

          {!hasApiProfiles && (
            <div className="border-t border-border p-4">
              <p className="text-xs text-muted-foreground">
                {t('agentProfile.apiProfiles.noProfiles')}
              </p>
            </div>
          )}

          {hasApiProfiles && (
            <div className="border-t border-border p-4 space-y-4">
              {PHASE_KEYS.map((phase) => (
                <div key={phase} className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {t(`agentProfile.phases.${phase}.label`)}
                  </Label>
                  <select
                    className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground"
                    value={
                      currentPhaseApiProfiles[phase] && apiProfileIds.has(currentPhaseApiProfiles[phase]!)
                        ? currentPhaseApiProfiles[phase]
                        : defaultProfileValue
                    }
                    onChange={(event) => handlePhaseApiProfileChange(phase, event.target.value)}
                  >
                    <option value={defaultProfileValue}>
                      {activeApiProfileId
                        ? t('agentProfile.apiProfiles.activeProfile', {
                          name: apiProfiles.find((profile) => profile.id === activeApiProfileId)?.name || t('agentProfile.apiProfiles.useActive')
                        })
                        : t('agentProfile.apiProfiles.useActive')}
                    </option>
                    {apiProfiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SettingsSection>
  );
}
