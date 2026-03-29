/**
 * Business Registration Form — Demo Client Tools
 *
 * A realistic government-style business registration form.
 * Tools manipulate React state directly via refs.
 */

import type { MutableRefObject } from 'react'
import { tool, string, integer, boolean, enumOf, type ClientTool } from '@inferencesh/sdk'

// =============================================================================
// State types
// =============================================================================

export interface BusinessFormState {
  // Entity information
  entityType: string
  businessName: string
  dba: string
  naicsCode: string
  stateOfFormation: string
  // Registered agent
  agentName: string
  agentAddress: string
  agentCity: string
  agentState: string
  agentZip: string
  // Principal office
  principalAddress: string
  principalCity: string
  principalState: string
  principalZip: string
  sameAsAgent: boolean
  // Officers
  officers: Officer[]
  // Filing options
  expedited: boolean
  certifiedCopy: boolean
  effectiveDate: string // 'immediate' | 'delayed'
  fiscalYearEnd: string
}

export interface Officer {
  name: string
  title: string
  address: string
}

export interface BusinessFormActions {
  getState: () => BusinessFormState
  setField: (field: string, value: string | boolean) => void
  addOfficer: (officer: Officer) => void
  removeOfficer: (index: number) => void
  setSameAsAgent: (same: boolean) => void
}

export const DEFAULT_FORM_STATE: BusinessFormState = {
  entityType: '',
  businessName: '',
  dba: '',
  naicsCode: '',
  stateOfFormation: '',
  agentName: '',
  agentAddress: '',
  agentCity: '',
  agentState: '',
  agentZip: '',
  principalAddress: '',
  principalCity: '',
  principalState: '',
  principalZip: '',
  sameAsAgent: false,
  officers: [],
  expedited: false,
  certifiedCopy: false,
  effectiveDate: 'immediate',
  fiscalYearEnd: 'december',
}

// =============================================================================
// Fee calculation
// =============================================================================

const FILING_FEES: Record<string, number> = {
  llc: 100,
  corporation: 125,
  's-corp': 125,
  partnership: 75,
  nonprofit: 50,
  sole_proprietorship: 25,
}

export function calculateFees(state: BusinessFormState): {
  filingFee: number
  expeditedFee: number
  certifiedCopyFee: number
  total: number
} {
  const filingFee = FILING_FEES[state.entityType] ?? 0
  const expeditedFee = state.expedited ? 50 : 0
  const certifiedCopyFee = state.certifiedCopy ? 15 : 0
  return {
    filingFee,
    expeditedFee,
    certifiedCopyFee,
    total: filingFee + expeditedFee + certifiedCopyFee,
  }
}

// =============================================================================
// Tool factory
// =============================================================================

export function createFormTools(
  actionsRef: MutableRefObject<BusinessFormActions>,
): ClientTool[] {
  const actions = () => actionsRef.current

  const getForm = tool('get_form')
    .displayName('Get Form')
    .describe('Returns the current state of the business registration form including all fields, officers, and calculated filing fees.')
    .handler(async () => {
      const state = actions().getState()
      const fees = calculateFees(state)
      return JSON.stringify({ ...state, fees }, null, 2)
    })

  const setField = tool('set_field')
    .displayName('Set Field')
    .describe('Sets a field on the business registration form.')
    .param('field', enumOf([
      'entityType', 'businessName', 'dba', 'naicsCode', 'stateOfFormation',
      'agentName', 'agentAddress', 'agentCity', 'agentState', 'agentZip',
      'principalAddress', 'principalCity', 'principalState', 'principalZip',
      'effectiveDate', 'fiscalYearEnd',
    ] as const, 'The form field to set'))
    .param('value', string('The value to set'))
    .handler(async ({ field, value }) => {
      actions().setField(field as string, value as string)
      return JSON.stringify({ ok: true, field, value })
    })

  const setEntityType = tool('set_entity_type')
    .displayName('Set Entity Type')
    .describe('Sets the business entity type. This determines the filing fee.')
    .param('type', enumOf([
      'llc', 'corporation', 's-corp', 'partnership', 'nonprofit', 'sole_proprietorship',
    ] as const, 'Entity type: llc ($100), corporation ($125), s-corp ($125), partnership ($75), nonprofit ($50), sole_proprietorship ($25)'))
    .handler(async ({ type }) => {
      actions().setField('entityType', type as string)
      return JSON.stringify({ ok: true, entityType: type, filingFee: FILING_FEES[type as string] ?? 0 })
    })

  const setFilingOption = tool('set_filing_option')
    .displayName('Set Filing Option')
    .describe('Enables or disables a filing option (expedited processing or certified copy).')
    .param('option', enumOf(
      ['expedited', 'certifiedCopy'] as const,
      'The option: expedited ($50 surcharge) or certifiedCopy ($15)',
    ))
    .param('enabled', boolean('Whether to enable or disable'))
    .handler(async ({ option, enabled }) => {
      actions().setField(option as string, enabled as boolean)
      return JSON.stringify({ ok: true, option, enabled })
    })

  const addOfficer = tool('add_officer')
    .displayName('Add Officer')
    .describe('Adds an officer/director to the registration. At least one is required for corporations and nonprofits.')
    .param('name', string('Full legal name of the officer'))
    .param('title', string('Title (e.g., CEO, President, Secretary, Director, Managing Member)'))
    .param('address', string('Business address of the officer'))
    .handler(async ({ name, title, address }) => {
      actions().addOfficer({
        name: name as string,
        title: title as string,
        address: address as string,
      })
      return JSON.stringify({ ok: true, added: { name, title, address } })
    })

  const removeOfficer = tool('remove_officer')
    .displayName('Remove Officer')
    .describe('Removes an officer by their index (0-based).')
    .param('index', integer('Index of the officer to remove'))
    .handler(async ({ index }) => {
      const state = actions().getState()
      if ((index as number) < 0 || (index as number) >= state.officers.length) {
        return JSON.stringify({ error: `invalid index ${index}, have ${state.officers.length} officers` })
      }
      actions().removeOfficer(index as number)
      return JSON.stringify({ ok: true, removed: index })
    })

  const copySameAsAgent = tool('copy_agent_to_principal')
    .displayName('Copy Agent Address')
    .describe('Copies the registered agent address to the principal office address.')
    .handler(async () => {
      actions().setSameAsAgent(true)
      return JSON.stringify({ ok: true, message: 'principal office address set to match registered agent' })
    })

  return [getForm, setField, setEntityType, setFilingOption, addOfficer, removeOfficer, copySameAsAgent]
}

// =============================================================================
// System prompt
// =============================================================================

export const FORM_SYSTEM_PROMPT = `You are a helpful assistant guiding users through a business registration form. You can read the form and fill in fields using client tools that directly access the form state.

## Available Tools

- **get_form** — read the full form state and calculated fees
- **set_field** — set any text field (businessName, dba, naicsCode, stateOfFormation, agent/principal address fields, effectiveDate, fiscalYearEnd)
- **set_entity_type** — set the entity type (llc, corporation, s-corp, partnership, nonprofit, sole_proprietorship)
- **set_filing_option** — toggle expedited processing or certified copy
- **add_officer** — add an officer/director (name, title, address)
- **remove_officer** — remove an officer by index
- **copy_agent_to_principal** — copy registered agent address to principal office

## Form Structure

### 1. Entity Information
- **Entity Type**: LLC ($100), Corporation ($125), S-Corp ($125), Partnership ($75), Nonprofit ($50), Sole Proprietorship ($25)
- **Business Name**: Legal name of the business
- **DBA (Doing Business As)**: Optional trade name
- **NAICS Code**: 6-digit industry classification code
- **State of Formation**: State where the business is being formed

### 2. Registered Agent (required — person/entity to receive legal notices)
- Name, street address, city, state, zip

### 3. Principal Office Address
- Can be same as registered agent address
- Street address, city, state, zip

### 4. Officers/Directors
- At least one required for corporations and nonprofits
- Name, title, business address

### 5. Filing Options
- **Expedited Processing**: +$50 (3 business days vs 2-4 weeks)
- **Certified Copy**: +$15
- **Effective Date**: Immediate or delayed
- **Fiscal Year End**: Month the fiscal year ends

## Instructions

1. Always use \`get_form\` first to see current state
2. Guide users step by step — don't overwhelm with all fields at once
3. Suggest common NAICS codes when relevant (e.g., 541511 for software, 722511 for restaurants)
4. Remind about required fields (entity type, business name, registered agent)
5. After changes, confirm what you set and mention the current total fees
6. Be concise and helpful`

export const FORM_EXAMPLE_PROMPTS = [
  'I want to register a new LLC in Delaware',
  "help me fill this out for a tech startup",
  "what's the cheapest way to register?",
]
