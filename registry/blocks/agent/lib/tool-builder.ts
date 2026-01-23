/**
 * Tool Builder - Fluent API for defining tools
 * 
 * A DX-friendly way to define tools with type inference.
 * 
 * ## Tool Types
 * 
 * | Type | Runs On | Has Handler | Example |
 * |------|---------|-------------|---------|
 * | `tool()` | Browser | Yes | DOM manipulation, localStorage |
 * | `hookTool()` | Browser | Yes (via hook) | useGeolocation, useAuth |
 * | `appTool()` | Server | No | Image generation, code execution |
 * | `agentTool()` | Server | No | Sub-agent delegation |
 * | `webhookTool()` | External | No | Third-party APIs |
 * 
 * @example Client tool
 * ```typescript
 * const scanUI = tool('scan_ui')
 *   .describe('Scans the DOM')
 *   .handler(async () => { ... });
 * ```
 * 
 * @example App tool with HIL
 * ```typescript
 * const deploy = appTool('deploy', 'infsh/deploy-app@abc123')
 *   .describe('Deploys to production')
 *   .requireApproval()  // Human must approve
 *   .param('env', enumOf(['staging', 'prod']))
 *   .build();
 * ```
 * 
 * @example Internal tools config
 * ```typescript
 * const config = {
 *   core_app: { ref: '...' },
 *   internal_tools: internalTools()
 *     .plan()
 *     .memory()
 *     .finish()
 *     .build(),
 * };
 * ```
 */

import {
  ToolTypeClient,
  ToolTypeApp,
  ToolTypeAgent,
  ToolTypeHook,
  type AgentTool,
  type InternalToolsConfig,
} from '@inferencesh/sdk';
import type { ClientTool, ClientToolHandlerFn } from '@/components/agent/types';

// =============================================================================
// Schema Types
// =============================================================================

type JsonSchemaType = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array';

interface BaseSchema {
  type: JsonSchemaType;
  description?: string;
  optional?: boolean;
}

interface StringSchema extends BaseSchema {
  type: 'string';
  enum?: string[];
}

interface NumberSchema extends BaseSchema {
  type: 'number' | 'integer';
  minimum?: number;
  maximum?: number;
}

interface BooleanSchema extends BaseSchema {
  type: 'boolean';
}

interface ObjectSchema extends BaseSchema {
  type: 'object';
  properties: Record<string, ParamSchema>;
}

interface ArraySchema extends BaseSchema {
  type: 'array';
  items: ParamSchema;
}

type ParamSchema = StringSchema | NumberSchema | BooleanSchema | ObjectSchema | ArraySchema;

// =============================================================================
// Type Inference
// =============================================================================

type InferType<T extends ParamSchema> =
  T extends StringSchema
  ? T['enum'] extends readonly string[]
  ? T['enum'][number]
  : string
  : T extends NumberSchema
  ? number
  : T extends BooleanSchema
  ? boolean
  : T extends ObjectSchema
  ? { [K in keyof T['properties']as T['properties'][K]['optional'] extends true ? never : K]: InferType<T['properties'][K]> }
  & { [K in keyof T['properties']as T['properties'][K]['optional'] extends true ? K : never]?: InferType<T['properties'][K]> }
  : T extends ArraySchema
  ? InferType<T['items']>[]
  : unknown;

type InferParams<T extends Record<string, ParamSchema>> = {
  [K in keyof T as T[K]['optional'] extends true ? never : K]: InferType<T[K]>;
} & {
  [K in keyof T as T[K]['optional'] extends true ? K : never]?: InferType<T[K]>;
};

// =============================================================================
// Schema Builders
// =============================================================================

/** String parameter */
export function string(description?: string): StringSchema {
  return { type: 'string', description };
}

/** String enum parameter */
export function enumOf<T extends readonly string[]>(values: T, description?: string): StringSchema & { enum: T } {
  return { type: 'string', enum: values as unknown as string[], description } as StringSchema & { enum: T };
}

/** Number parameter */
export function number(description?: string): NumberSchema {
  return { type: 'number', description };
}

/** Integer parameter */
export function integer(description?: string): NumberSchema {
  return { type: 'integer', description };
}

/** Boolean parameter */
export function boolean(description?: string): BooleanSchema {
  return { type: 'boolean', description };
}

/** Object with nested properties */
export function object<T extends Record<string, ParamSchema>>(
  properties: T,
  description?: string
): ObjectSchema & { properties: T } {
  return { type: 'object', properties, description } as ObjectSchema & { properties: T };
}

/** Array parameter */
export function array<T extends ParamSchema>(items: T, description?: string): ArraySchema & { items: T } {
  return { type: 'array', items, description } as ArraySchema & { items: T };
}

/** Make a schema optional */
export function optional<T extends ParamSchema>(schema: T): T & { optional: true } {
  return { ...schema, optional: true } as T & { optional: true };
}

// =============================================================================
// JSON Schema Generator
// =============================================================================

function toJsonSchema(schema: ParamSchema): Record<string, unknown> {
  const base: Record<string, unknown> = { type: schema.type };
  if (schema.description) base.description = schema.description;

  if (schema.type === 'string' && 'enum' in schema && schema.enum) {
    base.enum = schema.enum;
  }

  if ((schema.type === 'number' || schema.type === 'integer')) {
    const numSchema = schema as NumberSchema;
    if (numSchema.minimum !== undefined) base.minimum = numSchema.minimum;
    if (numSchema.maximum !== undefined) base.maximum = numSchema.maximum;
  }

  if (schema.type === 'object') {
    const objSchema = schema as ObjectSchema;
    const properties: Record<string, unknown> = {};
    const required: string[] = [];
    for (const [key, propSchema] of Object.entries(objSchema.properties)) {
      properties[key] = toJsonSchema(propSchema);
      if (!propSchema.optional) required.push(key);
    }
    base.properties = properties;
    if (required.length > 0) base.required = required;
  }

  if (schema.type === 'array') {
    base.items = toJsonSchema((schema as ArraySchema).items);
  }

  return base;
}

function paramsToJsonSchema(params: Record<string, ParamSchema>): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];
  for (const [key, schema] of Object.entries(params)) {
    properties[key] = toJsonSchema(schema);
    if (!schema.optional) required.push(key);
  }
  return { type: 'object', properties, required };
}

// =============================================================================
// Base Builder State
// =============================================================================

interface BaseToolState<TParams extends Record<string, ParamSchema>> {
  name: string;
  displayName?: string;
  description: string;
  params: TParams;
  requireApproval: boolean;
}

// =============================================================================
// CLIENT TOOL BUILDER (runs in browser, has handler)
// =============================================================================

class ClientToolBuilder<TParams extends Record<string, ParamSchema> = Record<string, never>> {
  private state: BaseToolState<TParams>;

  constructor(name: string) {
    this.state = { name, description: '', params: {} as TParams, requireApproval: false };
  }

  /** Set description */
  describe(description: string): this {
    this.state.description = description;
    return this;
  }

  /** Set display name */
  displayName(name: string): this {
    this.state.displayName = name;
    return this;
  }

  /** Require human approval before execution (HIL) */
  requireApproval(): this {
    this.state.requireApproval = true;
    return this;
  }

  /** Alias for requireApproval */
  hil(): this {
    return this.requireApproval();
  }

  /** Add a parameter */
  param<K extends string, S extends ParamSchema>(
    name: K,
    schema: S
  ): ClientToolBuilder<TParams & Record<K, S>> {
    const newBuilder = new ClientToolBuilder<TParams & Record<K, S>>(this.state.name);
    newBuilder.state = {
      ...this.state,
      params: { ...this.state.params, [name]: schema } as TParams & Record<K, S>,
    };
    return newBuilder;
  }

  /** Define handler and build the tool */
  handler(fn: (args: InferParams<TParams>) => Promise<string> | string): ClientTool {
    return {
      schema: {
        name: this.state.name,
        display_name: this.state.displayName || this.state.name,
        description: this.state.description,
        type: ToolTypeClient,
        require_approval: this.state.requireApproval || undefined,
        client: { input_schema: paramsToJsonSchema(this.state.params) },
      },
      handler: async (args) => fn(args as InferParams<TParams>),
    };
  }
}

/**
 * Create a client tool (runs in browser)
 * 
 * @example
 * ```typescript
 * const copyToClipboard = tool('copy')
 *   .describe('Copies text to clipboard')
 *   .param('text', string('Text to copy'))
 *   .handler(async ({ text }) => {
 *     await navigator.clipboard.writeText(text);
 *     return JSON.stringify({ success: true });
 *   });
 * ```
 */
export function tool(name: string): ClientToolBuilder {
  return new ClientToolBuilder(name);
}

// =============================================================================
// HOOK TOOL BUILDER (runs in browser, uses React hooks)
// =============================================================================

export interface HookTool {
  schema: AgentTool;
  useHandler: () => ClientToolHandlerFn;
}

class HookToolBuilder<TParams extends Record<string, ParamSchema> = Record<string, never>> {
  private state: BaseToolState<TParams>;
  private hookFactory: () => ClientToolHandlerFn;

  constructor(name: string, hookFactory: () => ClientToolHandlerFn) {
    this.state = { name, description: '', params: {} as TParams, requireApproval: false };
    this.hookFactory = hookFactory;
  }

  describe(description: string): this {
    this.state.description = description;
    return this;
  }

  displayName(name: string): this {
    this.state.displayName = name;
    return this;
  }

  requireApproval(): this {
    this.state.requireApproval = true;
    return this;
  }

  hil(): this {
    return this.requireApproval();
  }

  param<K extends string, S extends ParamSchema>(
    name: K,
    schema: S
  ): HookToolBuilder<TParams & Record<K, S>> {
    const newBuilder = new HookToolBuilder<TParams & Record<K, S>>(this.state.name, this.hookFactory);
    newBuilder.state = {
      ...this.state,
      params: { ...this.state.params, [name]: schema } as TParams & Record<K, S>,
    };
    return newBuilder;
  }

  /** Build the hook tool */
  build(): HookTool {
    return {
      schema: {
        name: this.state.name,
        display_name: this.state.displayName || this.state.name,
        description: this.state.description,
        type: ToolTypeClient,
        require_approval: this.state.requireApproval || undefined,
        client: { input_schema: paramsToJsonSchema(this.state.params) },
      },
      useHandler: this.hookFactory,
    };
  }
}

/**
 * Create a hook-based tool (uses React hooks)
 * 
 * @example
 * ```typescript
 * const authTool = hookTool('get_user', () => {
 *   const { user } = useAuth();
 *   return async () => JSON.stringify(user);
 * })
 *   .describe('Gets current user info')
 *   .build();
 * ```
 */
export function hookTool(name: string, useHandler: () => ClientToolHandlerFn): HookToolBuilder {
  return new HookToolBuilder(name, useHandler);
}

/** Convert HookTools to ClientTools (call in component) */
export function useHookTools(hookTools: HookTool[]): ClientTool[] {
  return hookTools.map(ht => ({ schema: ht.schema, handler: ht.useHandler() }));
}

// =============================================================================
// APP TOOL BUILDER (runs on server, calls another app)
// =============================================================================

class AppToolBuilder<TParams extends Record<string, ParamSchema> = Record<string, never>> {
  private state: BaseToolState<TParams> & { appRef: string };

  constructor(name: string, appRef: string) {
    this.state = { name, appRef, description: '', params: {} as TParams, requireApproval: false };
  }

  describe(description: string): this {
    this.state.description = description;
    return this;
  }

  displayName(name: string): this {
    this.state.displayName = name;
    return this;
  }

  requireApproval(): this {
    this.state.requireApproval = true;
    return this;
  }

  hil(): this {
    return this.requireApproval();
  }

  param<K extends string, S extends ParamSchema>(
    name: K,
    schema: S
  ): AppToolBuilder<TParams & Record<K, S>> {
    const newBuilder = new AppToolBuilder<TParams & Record<K, S>>(this.state.name, this.state.appRef);
    newBuilder.state = {
      ...this.state,
      params: { ...this.state.params, [name]: schema } as TParams & Record<K, S>,
    };
    return newBuilder;
  }

  /** Build the app tool schema */
  build(): AgentTool {
    return {
      name: this.state.name,
      display_name: this.state.displayName || this.state.name,
      description: this.state.description,
      type: ToolTypeApp,
      require_approval: this.state.requireApproval || undefined,
      app: {
        ref: this.state.appRef,
      },
    };
  }
}

/**
 * Create an app tool (calls another inference app on server)
 * 
 * @example
 * ```typescript
 * const imageGen = appTool('generate_image', 'infsh/flux-schnell@abc123')
 *   .describe('Generates an image from a prompt')
 *   .param('prompt', string('Image description'))
 *   .requireApproval()  // Costs credits, require approval
 *   .build();
 * ```
 */
export function appTool(name: string, appRef: string): AppToolBuilder {
  return new AppToolBuilder(name, appRef);
}

// =============================================================================
// AGENT TOOL BUILDER (runs on server, delegates to sub-agent)
// =============================================================================

class AgentToolBuilder<TParams extends Record<string, ParamSchema> = Record<string, never>> {
  private state: BaseToolState<TParams> & { agentRef: string };

  constructor(name: string, agentRef: string) {
    this.state = { name, agentRef, description: '', params: {} as TParams, requireApproval: false };
  }

  describe(description: string): this {
    this.state.description = description;
    return this;
  }

  displayName(name: string): this {
    this.state.displayName = name;
    return this;
  }

  requireApproval(): this {
    this.state.requireApproval = true;
    return this;
  }

  hil(): this {
    return this.requireApproval();
  }

  param<K extends string, S extends ParamSchema>(
    name: K,
    schema: S
  ): AgentToolBuilder<TParams & Record<K, S>> {
    const newBuilder = new AgentToolBuilder<TParams & Record<K, S>>(this.state.name, this.state.agentRef);
    newBuilder.state = {
      ...this.state,
      params: { ...this.state.params, [name]: schema } as TParams & Record<K, S>,
    };
    return newBuilder;
  }

  /** Build the agent tool schema */
  build(): AgentTool {
    return {
      name: this.state.name,
      display_name: this.state.displayName || this.state.name,
      description: this.state.description,
      type: ToolTypeAgent,
      require_approval: this.state.requireApproval || undefined,
      agent: {
        ref: this.state.agentRef,
      },
    };
  }
}

/**
 * Create a sub-agent tool (delegates to another agent on server)
 * 
 * @example
 * ```typescript
 * const codeReviewer = agentTool('review_code', 'infsh/code-reviewer@xyz789')
 *   .describe('Reviews code for best practices')
 *   .param('code', string('Code to review'))
 *   .param('language', enumOf(['typescript', 'python', 'go']))
 *   .build();
 * ```
 */
export function agentTool(name: string, agentRef: string): AgentToolBuilder {
  return new AgentToolBuilder(name, agentRef);
}

// =============================================================================
// WEBHOOK TOOL BUILDER (calls external URL)
// =============================================================================

class WebhookToolBuilder<TParams extends Record<string, ParamSchema> = Record<string, never>> {
  private state: BaseToolState<TParams> & { url: string; secret?: string };

  constructor(name: string, url: string) {
    this.state = { name, url, description: '', params: {} as TParams, requireApproval: false };
  }

  describe(description: string): this {
    this.state.description = description;
    return this;
  }

  displayName(name: string): this {
    this.state.displayName = name;
    return this;
  }

  /** Set webhook secret for authentication */
  secret(secret: string): this {
    this.state.secret = secret;
    return this;
  }

  requireApproval(): this {
    this.state.requireApproval = true;
    return this;
  }

  hil(): this {
    return this.requireApproval();
  }

  param<K extends string, S extends ParamSchema>(
    name: K,
    schema: S
  ): WebhookToolBuilder<TParams & Record<K, S>> {
    const newBuilder = new WebhookToolBuilder<TParams & Record<K, S>>(this.state.name, this.state.url);
    newBuilder.state = {
      ...this.state,
      params: { ...this.state.params, [name]: schema } as TParams & Record<K, S>,
    };
    return newBuilder;
  }

  /** Build the webhook tool schema */
  build(): AgentTool {
    return {
      name: this.state.name,
      display_name: this.state.displayName || this.state.name,
      description: this.state.description,
      type: ToolTypeHook,
      require_approval: this.state.requireApproval || undefined,
      hook: {
        url: this.state.url,
        secret: this.state.secret,
        input_schema: paramsToJsonSchema(this.state.params),
      },
    };
  }
}

/**
 * Create a webhook tool (calls external URL)
 * 
 * @example
 * ```typescript
 * const slackNotify = webhookTool('notify_slack', 'https://hooks.slack.com/...')
 *   .describe('Sends a Slack notification')
 *   .secret(process.env.SLACK_SECRET)
 *   .param('channel', string('Channel name'))
 *   .param('message', string('Message text'))
 *   .build();
 * ```
 */
export function webhookTool(name: string, url: string): WebhookToolBuilder {
  return new WebhookToolBuilder(name, url);
}

// =============================================================================
// INTERNAL TOOLS CONFIG BUILDER
// =============================================================================

class InternalToolsBuilder {
  private config: InternalToolsConfig = {};

  /** Enable plan tools (Create, Update, Load) */
  plan(enabled = true): this {
    this.config.plan = enabled;
    return this;
  }

  /** Enable memory tools (Set, Get, GetAll) */
  memory(enabled = true): this {
    this.config.memory = enabled;
    return this;
  }

  /** Enable widget tools (UI, HTML) - top-level agents only */
  widget(enabled = true): this {
    this.config.widget = enabled;
    return this;
  }

  /** Enable finish tool - sub-agents only */
  finish(enabled = true): this {
    this.config.finish = enabled;
    return this;
  }

  /** Enable all internal tools */
  all(): this {
    this.config.plan = true;
    this.config.memory = true;
    this.config.widget = true;
    this.config.finish = true;
    return this;
  }

  /** Disable all internal tools */
  none(): this {
    this.config.plan = false;
    this.config.memory = false;
    this.config.widget = false;
    this.config.finish = false;
    return this;
  }

  /** Build the config */
  build(): InternalToolsConfig {
    return this.config;
  }
}

/**
 * Create an internal tools configuration (fluent builder)
 * 
 * @example
 * ```typescript
 * // Simple - just use an object
 * internalTools: { plan: true, memory: true }
 * 
 * // Or use builder
 * internalTools: internalTools().plan().memory().build()
 * ```
 */
export function internalTools(): InternalToolsBuilder {
  return new InternalToolsBuilder();
}

// =============================================================================
// UTILITIES
// =============================================================================

/** Create multiple tools from a record */
export function createTools(tools: Record<string, ClientTool>): ClientTool[] {
  return Object.values(tools);
}

/** Create multiple server tools from a record */
export function createServerTools(tools: Record<string, AgentTool>): AgentTool[] {
  return Object.values(tools);
}
