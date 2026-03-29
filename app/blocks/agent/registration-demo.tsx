'use client'

import { useState, useRef, useMemo, useCallback } from 'react'
import { FileText } from 'lucide-react'
import { Agent } from '@/registry/blocks/agent/agent'
import { ScrollMore } from '@/registry/blocks/scroll-more/scroll-more'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  createFormTools,
  calculateFees,
  FORM_SYSTEM_PROMPT,
  FORM_EXAMPLE_PROMPTS,
  DEFAULT_FORM_STATE,
  type BusinessFormState,
  type BusinessFormActions,
  type Officer,
} from './lib/demo-tools'

// =============================================================================
// RegistrationForm
// =============================================================================

export function RegistrationForm({
  state,
  setField,
  addOfficer,
  removeOfficer,
  setSameAsAgent,
}: {
  state: BusinessFormState
  setField: (field: string, value: string | boolean) => void
  addOfficer: (officer: Officer) => void
  removeOfficer: (index: number) => void
  setSameAsAgent: (same: boolean) => void
}) {
  const fees = calculateFees(state)
  const selectClass = "w-full h-10 px-3 rounded-md border bg-background text-sm"

  return (
    <form
      className="flex flex-col border rounded-lg bg-card h-full"
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="flex items-center gap-2 px-6 pt-6 pb-4">
        <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
        <h3 className="font-semibold">business entity registration</h3>
      </div>

      <ScrollMore className="flex-1">
      <div className="px-6 pb-4 space-y-5">
      {/* entity information */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-muted-foreground uppercase tracking-wider">entity information</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="entityType" className="text-xs">entity type *</Label>
            <select id="entityType" value={state.entityType} onChange={(e) => setField('entityType', e.target.value)} className={selectClass}>
              <option value="">select type...</option>
              <option value="llc">LLC ($100)</option>
              <option value="corporation">corporation ($125)</option>
              <option value="s-corp">s-corp ($125)</option>
              <option value="partnership">partnership ($75)</option>
              <option value="nonprofit">nonprofit ($50)</option>
              <option value="sole_proprietorship">sole proprietorship ($25)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stateOfFormation" className="text-xs">state of formation *</Label>
            <Input id="stateOfFormation" placeholder="e.g. Delaware" value={state.stateOfFormation} onChange={(e) => setField('stateOfFormation', e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="businessName" className="text-xs">legal business name *</Label>
          <Input id="businessName" placeholder="e.g. Acme Technologies LLC" value={state.businessName} onChange={(e) => setField('businessName', e.target.value)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="dba" className="text-xs">DBA (doing business as)</Label>
            <Input id="dba" placeholder="optional trade name" value={state.dba} onChange={(e) => setField('dba', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="naicsCode" className="text-xs">NAICS code</Label>
            <Input id="naicsCode" placeholder="e.g. 541511" value={state.naicsCode} onChange={(e) => setField('naicsCode', e.target.value)} />
          </div>
        </div>
      </fieldset>

      {/* registered agent */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-muted-foreground uppercase tracking-wider">registered agent *</legend>
        <div className="space-y-1.5">
          <Label htmlFor="agentName" className="text-xs">agent name</Label>
          <Input id="agentName" placeholder="full legal name" value={state.agentName} onChange={(e) => setField('agentName', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="agentAddress" className="text-xs">street address</Label>
          <Input id="agentAddress" value={state.agentAddress} onChange={(e) => setField('agentAddress', e.target.value)} />
        </div>
        <div className="grid gap-3 grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="agentCity" className="text-xs">city</Label>
            <Input id="agentCity" value={state.agentCity} onChange={(e) => setField('agentCity', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="agentState" className="text-xs">state</Label>
            <Input id="agentState" value={state.agentState} onChange={(e) => setField('agentState', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="agentZip" className="text-xs">zip</Label>
            <Input id="agentZip" value={state.agentZip} onChange={(e) => setField('agentZip', e.target.value)} />
          </div>
        </div>
      </fieldset>

      {/* principal office */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-muted-foreground uppercase tracking-wider">principal office</legend>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={state.sameAsAgent} onChange={(e) => setSameAsAgent(e.target.checked)} className="rounded" />
          <span className="text-xs">same as registered agent</span>
        </label>
        {!state.sameAsAgent && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="principalAddress" className="text-xs">street address</Label>
              <Input id="principalAddress" value={state.principalAddress} onChange={(e) => setField('principalAddress', e.target.value)} />
            </div>
            <div className="grid gap-3 grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="principalCity" className="text-xs">city</Label>
                <Input id="principalCity" value={state.principalCity} onChange={(e) => setField('principalCity', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="principalState" className="text-xs">state</Label>
                <Input id="principalState" value={state.principalState} onChange={(e) => setField('principalState', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="principalZip" className="text-xs">zip</Label>
                <Input id="principalZip" value={state.principalZip} onChange={(e) => setField('principalZip', e.target.value)} />
              </div>
            </div>
          </>
        )}
      </fieldset>

      {/* officers */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-muted-foreground uppercase tracking-wider">officers / directors</legend>
        {state.officers.length === 0 ? (
          <p className="text-xs text-muted-foreground">no officers added yet. required for corporations and nonprofits.</p>
        ) : (
          <div className="space-y-2">
            {state.officers.map((officer, i) => (
              <div key={i} className="flex items-center gap-2 text-xs border rounded-md px-3 py-2">
                <span className="flex-1"><span className="font-medium">{officer.name}</span> — {officer.title}</span>
                <button type="button" onClick={() => removeOfficer(i)} className="text-muted-foreground hover:text-destructive">&times;</button>
              </div>
            ))}
          </div>
        )}
      </fieldset>

      {/* filing options */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-muted-foreground uppercase tracking-wider">filing options</legend>
        <div className="flex gap-4">
          {(['immediate', 'delayed'] as const).map((v) => (
            <label key={v} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="effectiveDate" value={v} checked={state.effectiveDate === v} onChange={(e) => setField('effectiveDate', e.target.value)} className="rounded" />
              <span className="text-xs">{v}</span>
            </label>
          ))}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fiscalYearEnd" className="text-xs">fiscal year end</Label>
          <select id="fiscalYearEnd" value={state.fiscalYearEnd} onChange={(e) => setField('fiscalYearEnd', e.target.value)} className={selectClass}>
            {['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={state.expedited} onChange={(e) => setField('expedited', e.target.checked)} className="rounded" />
            <span className="text-xs">expedited processing (+$50)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={state.certifiedCopy} onChange={(e) => setField('certifiedCopy', e.target.checked)} className="rounded" />
            <span className="text-xs">certified copy (+$15)</span>
          </label>
        </div>
      </fieldset>

      </div>
      </ScrollMore>

      {/* fee summary — pinned at bottom */}
      <div className="px-6 py-4 border-t space-y-1">
        {fees.filingFee > 0 && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>filing fee</span><span>${fees.filingFee}</span>
          </div>
        )}
        {fees.expeditedFee > 0 && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>expedited</span><span>${fees.expeditedFee}</span>
          </div>
        )}
        {fees.certifiedCopyFee > 0 && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>certified copy</span><span>${fees.certifiedCopyFee}</span>
          </div>
        )}
        <div className="flex justify-between items-center pt-2">
          <span className="text-muted-foreground font-medium text-sm">total fees</span>
          <span className="text-xl font-bold">${fees.total}</span>
        </div>
      </div>
    </form>
  )
}

// =============================================================================
// RegistrationDemo — form + agent side by side
// =============================================================================

interface RegistrationDemoProps {
  proxyUrl?: string
  apiKey?: string
}

export function RegistrationDemo({ proxyUrl, apiKey }: RegistrationDemoProps) {
  const [formState, setFormState] = useState<BusinessFormState>(DEFAULT_FORM_STATE)

  const setField = useCallback((field: string, value: string | boolean) => {
    setFormState(prev => ({ ...prev, [field]: value }))
  }, [])

  const addOfficer = useCallback((officer: Officer) => {
    setFormState(prev => ({ ...prev, officers: [...prev.officers, officer] }))
  }, [])

  const removeOfficer = useCallback((index: number) => {
    setFormState(prev => ({ ...prev, officers: prev.officers.filter((_, i) => i !== index) }))
  }, [])

  const setSameAsAgent = useCallback((same: boolean) => {
    setFormState(prev => {
      const updates: Partial<BusinessFormState> = { sameAsAgent: same }
      if (same) {
        updates.principalAddress = prev.agentAddress
        updates.principalCity = prev.agentCity
        updates.principalState = prev.agentState
        updates.principalZip = prev.agentZip
      }
      return { ...prev, ...updates }
    })
  }, [])

  const actionsRef = useRef<BusinessFormActions>(null!)
  actionsRef.current = { getState: () => formState, setField, addOfficer, removeOfficer, setSameAsAgent }

  const tools = useMemo(() => createFormTools(actionsRef), [])

  return (
    <div className="flex gap-4 max-h-[600px]">
      <div className="flex-1 min-h-0">
        <RegistrationForm
          state={formState}
          setField={setField}
          addOfficer={addOfficer}
          removeOfficer={removeOfficer}
          setSameAsAgent={setSameAsAgent}
        />
      </div>
      <div className="flex-1 border rounded-lg overflow-hidden">
        <Agent
          {...(proxyUrl ? { proxyUrl } : { apiKey })}
          name="registration-assistant"
          allowFiles={false}
          allowImages={false}
          config={{
            core_app: { ref: 'openrouter/claude-haiku-45@1ps10tmc' },
            description: 'I can help you fill out this business registration form',
            system_prompt: FORM_SYSTEM_PROMPT,
            tools,
            example_prompts: FORM_EXAMPLE_PROMPTS,
          }}
        />
      </div>
    </div>
  )
}

// =============================================================================
// AIAssistantDemo — wraps RegistrationDemo with proxy/apiKey toggle UI
// =============================================================================

export function AIAssistantDemo() {
  const [isStarted, setIsStarted] = useState(true)
  const [useProxy, setUseProxy] = useState(true)
  const [apiKey, setApiKey] = useState('')

  const handleStart = () => {
    if (useProxy || apiKey.trim()) {
      setIsStarted(true)
    }
  }

  return (
    <div className="space-y-4">
      {!isStarted ? (
        <div className="border rounded-lg p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            this demo shows an AI assistant that helps users navigate a complex government form.
            the agent uses client-side tools that directly manipulate React state.
          </p>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="use-proxy-assistant" checked={useProxy} onChange={(e) => setUseProxy(e.target.checked)} className="rounded" />
            <Label htmlFor="use-proxy-assistant" className="text-sm">use server proxy (requires INFERENCE_API_KEY in .env.local)</Label>
          </div>
          {!useProxy && (
            <div className="space-y-2">
              <Label htmlFor="api-key-assistant">API Key</Label>
              <Input id="api-key-assistant" type="password" placeholder="inf_..." value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
            </div>
          )}
          <Button onClick={handleStart} className="w-full" disabled={!useProxy && !apiKey.trim()}>start demo</Button>
        </div>
      ) : (
        <RegistrationDemo
          {...(useProxy ? { proxyUrl: '/api/inference/proxy' } : { apiKey })}
        />
      )}
    </div>
  )
}
