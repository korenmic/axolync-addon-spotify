const SETTING_ID_PATTERN = /^[a-z][a-z0-9_]*$/;
const ACTION_ID_PATTERN = /^[a-z][a-z0-9_]*$/;
const ACTION_CATEGORY_PATTERN = /^[a-z][a-z0-9_-]*$/;
const SURFACE_ID_PATTERN = /^[a-z][a-z0-9_]*$/;
const SECTION_ID_PATTERN = /^[a-z][a-z0-9_]*$/;
const FACT_ID_PATTERN = /^[a-z][a-z0-9_]*$/;
const ITEM_ID_PATTERN = /^[a-z0-9][a-z0-9._-]*$/;
const STATUS_ID_PATTERN = /^[a-z][a-z0-9_-]*$/;
const VALID_SETTING_KINDS = new Set(['boolean', 'string', 'integer', 'enum']);
const VALID_RUNTIME_SECTION_KINDS = new Set(['collection', 'facts']);

function ensureNonEmptyString(value, label) {
  const normalized = String(value ?? '').trim();
  if (!normalized) {
    throw new TypeError(`${label} must be a non-empty string.`);
  }
  return normalized;
}

function ensureOptionalString(value, label) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return ensureNonEmptyString(value, label);
}

function ensureBoolean(value, label) {
  if (typeof value !== 'boolean') {
    throw new TypeError(`${label} must be a boolean.`);
  }
  return value;
}

function ensureFunction(value, label) {
  if (typeof value !== 'function') {
    throw new TypeError(`${label} must be a function or class reference.`);
  }
}

function ensurePattern(value, label, pattern, patternLabel) {
  const normalized = ensureNonEmptyString(value, label);
  if (!pattern.test(normalized)) {
    throw new TypeError(`${label} must match ${patternLabel}.`);
  }
  return normalized;
}

function ensureStringArray(values, label) {
  if (!Array.isArray(values)) {
    throw new TypeError(`${label} must be an array.`);
  }
  return Object.freeze(values.map((value, index) => ensureNonEmptyString(value, `${label}[${index}]`)));
}

function uniqueNonEmptyStrings(values) {
  return [...new Set((Array.isArray(values) ? values : [])
    .map((value) => String(value ?? '').trim())
    .filter(Boolean))];
}

function normalizeEnumValues(value, label) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${label} must be an array.`);
  }
  const normalized = [...new Set(value.map((entry, index) => ensureNonEmptyString(entry, `${label}[${index}]`)))];
  if (!normalized.length) {
    throw new TypeError(`${label} must contain at least one value.`);
  }
  return Object.freeze(normalized);
}

function normalizeDynamicOptionSourceDefinition(optionSource, label) {
  return Object.freeze({
    surfaceId: ensurePattern(
      optionSource?.surfaceId ?? optionSource?.surface_id,
      `${label}.surfaceId`,
      SURFACE_ID_PATTERN,
      '/^[a-z][a-z0-9_]*$/',
    ),
    sectionId: ensurePattern(
      optionSource?.sectionId ?? optionSource?.section_id,
      `${label}.sectionId`,
      SECTION_ID_PATTERN,
      '/^[a-z][a-z0-9_]*$/',
    ),
  });
}

function normalizeLocalSettingDefinition(setting, label) {
  const settingId = ensurePattern(
    setting?.settingId ?? setting?.setting_id,
    `${label}.settingId`,
    SETTING_ID_PATTERN,
    '/^[a-z][a-z0-9_]*$/',
  );
  const kind = ensureNonEmptyString(setting?.kind, `${label}.kind`);
  if (!VALID_SETTING_KINDS.has(kind)) {
    throw new TypeError(`${label}.kind must be one of: ${[...VALID_SETTING_KINDS].join(', ')}.`);
  }

  const hasEnumValues = Object.prototype.hasOwnProperty.call(setting ?? {}, 'enumValues')
    || Object.prototype.hasOwnProperty.call(setting ?? {}, 'enum_values');
  const enumValues = hasEnumValues
    ? normalizeEnumValues(setting?.enumValues ?? setting?.enum_values, `${label}.enumValues`)
    : undefined;
  const hasOptionSource = Object.prototype.hasOwnProperty.call(setting ?? {}, 'optionSource')
    || Object.prototype.hasOwnProperty.call(setting ?? {}, 'option_source');
  const optionSource = hasOptionSource
    ? normalizeDynamicOptionSourceDefinition(setting?.optionSource ?? setting?.option_source, `${label}.optionSource`)
    : undefined;

  if (kind === 'enum' && !enumValues && !optionSource) {
    throw new TypeError(`${label}.enumValues or ${label}.optionSource is required when kind is "enum".`);
  }
  if (kind === 'enum' && enumValues && optionSource) {
    throw new TypeError(`${label}.enumValues and ${label}.optionSource cannot both be provided.`);
  }
  if (kind !== 'enum' && enumValues) {
    throw new TypeError(`${label}.enumValues is only allowed when kind is "enum".`);
  }
  if (kind !== 'enum' && optionSource) {
    throw new TypeError(`${label}.optionSource is only allowed when kind is "enum".`);
  }

  return Object.freeze({
    settingId,
    label: ensureNonEmptyString(setting?.label, `${label}.label`),
    kind,
    description: ensureOptionalString(setting?.description, `${label}.description`),
    hiddenInUi: setting?.hiddenInUi === undefined && setting?.hidden_in_ui === undefined
      ? false
      : ensureBoolean(setting?.hiddenInUi ?? setting?.hidden_in_ui, `${label}.hiddenInUi`),
    defaultValue: setting?.defaultValue ?? setting?.default_value,
    enumValues,
    optionSource,
  });
}

function toManifestSetting(setting) {
  return {
    setting_id: setting.settingId,
    label: setting.label,
    kind: setting.kind,
    description: setting.description,
    hidden_in_ui: setting.hiddenInUi,
    default_value: setting.defaultValue,
    ...(setting.enumValues ? { enum_values: [...setting.enumValues] } : {}),
    ...(setting.optionSource ? {
      option_source: {
        surface_id: setting.optionSource.surfaceId,
        section_id: setting.optionSource.sectionId,
      },
    } : {}),
  };
}

function normalizeRuntimeFactDefinition(fact, label) {
  return Object.freeze({
    factId: ensurePattern(
      fact?.factId ?? fact?.fact_id,
      `${label}.factId`,
      FACT_ID_PATTERN,
      '/^[a-z][a-z0-9_]*$/',
    ),
    label: ensureNonEmptyString(fact?.label, `${label}.label`),
    value: ensureNonEmptyString(fact?.value, `${label}.value`),
  });
}

function normalizeRuntimeItemDefinition(item, label) {
  return Object.freeze({
    itemId: ensurePattern(
      item?.itemId ?? item?.item_id,
      `${label}.itemId`,
      ITEM_ID_PATTERN,
      '/^[a-z0-9][a-z0-9._-]*$/',
    ),
    label: ensureNonEmptyString(item?.label, `${label}.label`),
    statuses: Object.freeze(uniqueNonEmptyStrings((item?.statuses ?? []).map((status, index) => ensurePattern(
      status,
      `${label}.statuses[${index}]`,
      STATUS_ID_PATTERN,
      '/^[a-z][a-z0-9_-]*$/',
    )))),
    facts: Object.freeze([...(item?.facts ?? []).map((fact, index) => normalizeRuntimeFactDefinition(
      fact,
      `${label}.facts[${index}]`,
    ))]),
    actionRefs: Object.freeze(uniqueNonEmptyStrings((item?.actionRefs ?? item?.action_refs ?? []).map((actionRef, index) => ensurePattern(
      actionRef,
      `${label}.actionRefs[${index}]`,
      ACTION_ID_PATTERN,
      '/^[a-z][a-z0-9_]*$/',
    )))),
  });
}

function normalizeRuntimeSectionDefinition(section, label) {
  const kind = ensureNonEmptyString(section?.kind, `${label}.kind`);
  if (!VALID_RUNTIME_SECTION_KINDS.has(kind)) {
    throw new TypeError(`${label}.kind must be one of: ${[...VALID_RUNTIME_SECTION_KINDS].join(', ')}.`);
  }

  const normalized = {
    sectionId: ensurePattern(
      section?.sectionId ?? section?.section_id,
      `${label}.sectionId`,
      SECTION_ID_PATTERN,
      '/^[a-z][a-z0-9_]*$/',
    ),
    label: ensureNonEmptyString(section?.label, `${label}.label`),
    kind,
    items: undefined,
    facts: undefined,
  };

  if (kind === 'collection') {
    normalized.items = Object.freeze([...(section?.items ?? []).map((item, index) => normalizeRuntimeItemDefinition(
      item,
      `${label}.items[${index}]`,
    ))]);
  } else {
    normalized.facts = Object.freeze([...(section?.facts ?? []).map((fact, index) => normalizeRuntimeFactDefinition(
      fact,
      `${label}.facts[${index}]`,
    ))]);
  }

  return Object.freeze(normalized);
}

function normalizeRuntimeDataSurfaceDefinition(surface, label) {
  return Object.freeze({
    surfaceId: ensurePattern(
      surface?.surfaceId ?? surface?.surface_id,
      `${label}.surfaceId`,
      SURFACE_ID_PATTERN,
      '/^[a-z][a-z0-9_]*$/',
    ),
    label: ensureNonEmptyString(surface?.label, `${label}.label`),
    sections: Object.freeze([...(surface?.sections ?? []).map((section, index) => normalizeRuntimeSectionDefinition(
      section,
      `${label}.sections[${index}]`,
    ))]),
  });
}

function toManifestRuntimeFact(fact) {
  return {
    fact_id: fact.factId,
    label: fact.label,
    value: fact.value,
  };
}

function toManifestRuntimeItem(item) {
  return {
    item_id: item.itemId,
    label: item.label,
    ...(item.statuses.length ? { statuses: [...item.statuses] } : {}),
    ...(item.facts.length ? { facts: item.facts.map(toManifestRuntimeFact) } : {}),
    ...(item.actionRefs.length ? { action_refs: [...item.actionRefs] } : {}),
  };
}

function toManifestRuntimeSection(section) {
  return {
    section_id: section.sectionId,
    label: section.label,
    kind: section.kind,
    ...(section.kind === 'collection' ? { items: section.items.map(toManifestRuntimeItem) } : {}),
    ...(section.kind === 'facts' ? { facts: section.facts.map(toManifestRuntimeFact) } : {}),
  };
}

function toManifestRuntimeDataSurface(surface) {
  return {
    surface_id: surface.surfaceId,
    label: surface.label,
    sections: surface.sections.map(toManifestRuntimeSection),
  };
}

function normalizeAddonActionDefinition(action, label) {
  const actionId = ensurePattern(
    action?.actionId ?? action?.action_id,
    `${label}.actionId`,
    ACTION_ID_PATTERN,
    '/^[a-z][a-z0-9_]*$/',
  );
  ensureFunction(action?.handler, `${label}.handler`);
  const bundlePath = ensureNonEmptyString(action?.bundlePath ?? action?.bundle_path, `${label}.bundlePath`);
  if (!(action?.sourceFileUrl instanceof URL)) {
    throw new TypeError(`${label}.sourceFileUrl must be a URL.`);
  }

  return Object.freeze({
    actionId,
    label: ensureNonEmptyString(action?.label, `${label}.label`),
    description: ensureNonEmptyString(action?.description, `${label}.description`),
    category: ensurePattern(
      action?.category,
      `${label}.category`,
      ACTION_CATEGORY_PATTERN,
      '/^[a-z][a-z0-9_-]*$/',
    ),
    destructive: ensureBoolean(action?.destructive, `${label}.destructive`),
    cancellable: ensureBoolean(action?.cancellable, `${label}.cancellable`),
    progressCapable: ensureBoolean(action?.progressCapable ?? action?.progress_capable, `${label}.progressCapable`),
    confirmationRequired: ensureBoolean(
      action?.confirmationRequired ?? action?.confirmation_required,
      `${label}.confirmationRequired`,
    ),
    handler: action.handler,
    bundlePath,
    sourceFileUrl: action.sourceFileUrl,
  });
}

function toManifestAction(action) {
  return {
    action_id: action.actionId,
    label: action.label,
    description: action.description,
    category: action.category,
    destructive: action.destructive,
    cancellable: action.cancellable,
    progress_capable: action.progressCapable,
    confirmation_required: action.confirmationRequired,
    handler: {
      module_path: action.bundlePath,
      export_name: action.handler.name,
    },
  };
}

function ensureImplementationReference(definition, label) {
  const modulePath = ensureNonEmptyString(
    definition?.modulePath ?? definition?.module_path,
    `${label}.modulePath`,
  );
  const exportName = ensureNonEmptyString(
    definition?.exportName ?? definition?.export_name,
    `${label}.exportName`,
  );
  return Object.freeze({
    modulePath,
    exportName,
  });
}

function ensureQueryMethods(queryMethods, label) {
  const normalized = {};
  for (const [lane, methods] of Object.entries(queryMethods ?? {})) {
    normalized[lane] = ensureStringArray(methods, `${label}.${lane}`);
  }
  if (!Object.keys(normalized).length) {
    throw new TypeError(`${label} must declare at least one query lane.`);
  }
  return Object.freeze(normalized);
}

export function defineAdapter(definition) {
  const adapterId = ensureNonEmptyString(definition?.adapterId ?? definition?.adapter_id, 'adapterId');
  return Object.freeze({
    adapterId,
    label: ensureNonEmptyString(definition?.label, `${adapterId}.label`),
    description: ensureNonEmptyString(definition?.description, `${adapterId}.description`),
    hostMode: ensureNonEmptyString(definition?.hostMode ?? definition?.host_mode ?? 'local-js', `${adapterId}.hostMode`),
    supportedPlatforms: ensureStringArray(definition?.supportedPlatforms ?? definition?.supported_platforms ?? [], `${adapterId}.supportedPlatforms`),
    requiredPermissions: ensureStringArray(definition?.requiredPermissions ?? definition?.required_permissions ?? [], `${adapterId}.requiredPermissions`),
    requiredHostCapabilities: ensureStringArray(definition?.requiredHostCapabilities ?? definition?.required_host_capabilities ?? [], `${adapterId}.requiredHostCapabilities`),
    gatingSettings: ensureStringArray(definition?.gatingSettings ?? definition?.gating_settings ?? [], `${adapterId}.gatingSettings`),
    settings: Object.freeze([...(definition?.settings ?? []).map((setting, index) => normalizeLocalSettingDefinition(
      setting,
      `${adapterId}.settings[${index}]`,
    ))]),
    implementation: ensureImplementationReference(definition?.implementation, `${adapterId}.implementation`),
    queryMethods: ensureQueryMethods(definition?.queryMethods ?? definition?.query_methods, `${adapterId}.queryMethods`),
  });
}

export function defineAddonAction(definition) {
  return normalizeAddonActionDefinition(definition, definition?.actionId ?? definition?.action_id ?? 'addonAction');
}

export function defineAddonRuntimeDataSurface(definition) {
  return normalizeRuntimeDataSurfaceDefinition(definition, definition?.surfaceId ?? definition?.surface_id ?? 'addonRuntimeDataSurface');
}

export function defineAddon(definition) {
  return Object.freeze({
    addonId: ensureNonEmptyString(definition?.addonId ?? definition?.addon_id, 'addonId'),
    name: ensureNonEmptyString(definition?.name, 'name'),
    version: ensureNonEmptyString(definition?.version, 'version'),
    contractsVersion: ensureNonEmptyString(definition?.contractsVersion ?? definition?.contracts_version, 'contractsVersion'),
    description: ensureNonEmptyString(definition?.description, 'description'),
    requirements: ensureStringArray(definition?.requirements ?? [], 'requirements'),
    addonSettings: Object.freeze([...(definition?.addonSettings ?? definition?.addon_settings ?? []).map((setting, index) => normalizeLocalSettingDefinition(
      setting,
      `addonSettings[${index}]`,
    ))]),
    addonActions: Object.freeze([...(definition?.addonActions ?? definition?.addon_actions ?? []).map((action, index) => normalizeAddonActionDefinition(
      action,
      `addonActions[${index}]`,
    ))]),
    addonRuntimeDataSurfaces: Object.freeze([...(definition?.addonRuntimeDataSurfaces ?? definition?.addon_runtime_data_surfaces ?? []).map((surface, index) => normalizeRuntimeDataSurfaceDefinition(
      surface,
      `addonRuntimeDataSurfaces[${index}]`,
    ))]),
    adapters: Object.freeze([...(definition?.adapters ?? [])]),
  });
}

export function buildManifestFromAddonDefinition(addon) {
  return {
    addon: {
      addon_id: addon.addonId,
      name: addon.name,
      version: addon.version,
      contracts_version: addon.contractsVersion,
      description: addon.description,
      requirements: [...addon.requirements],
      addon_settings: addon.addonSettings.map(toManifestSetting),
      addon_actions: addon.addonActions.map(toManifestAction),
      addon_runtime_data_surfaces: addon.addonRuntimeDataSurfaces.map(toManifestRuntimeDataSurface),
      adapters: addon.adapters.map((adapter) => ({
        adapter_id: adapter.adapterId,
        label: adapter.label,
        description: adapter.description,
        host_mode: adapter.hostMode,
        supported_platforms: [...adapter.supportedPlatforms],
        required_permissions: [...adapter.requiredPermissions],
        required_host_capabilities: [...adapter.requiredHostCapabilities],
        gating_settings: [...adapter.gatingSettings],
        settings: adapter.settings.map(toManifestSetting),
        implementation: {
          module_path: adapter.implementation.modulePath,
          export_name: adapter.implementation.exportName,
        },
        query_methods: Object.fromEntries(
          Object.entries(adapter.queryMethods).map(([lane, methods]) => [lane, [...methods]]),
        ),
      })),
    },
  };
}
