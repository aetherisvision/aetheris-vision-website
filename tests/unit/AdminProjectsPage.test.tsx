import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'

import AdminProjectsPage from '@/app/admin/projects/page'

const EMPTY_MILESTONES = {
  current_phase: 'proposal',
  phase_proposal_date: null,
  phase_kickoff_date: null,
  phase_design_date: null,
  phase_development_date: null,
  phase_review_date: null,
  phase_launched_date: null,
}

describe('admin project deletion affordance', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows deletion only for a proposal the API marks as unused and unlinked', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        projects: [
          {
            id: 1,
            name: 'Linked proposal',
            client_name: 'Prospect One',
            status: 'proposal',
            client_id: 10,
            can_delete: false,
            ...EMPTY_MILESTONES,
          },
          {
            id: 2,
            name: 'Unused proposal',
            client_name: null,
            status: 'proposal',
            can_delete: true,
            ...EMPTY_MILESTONES,
          },
        ],
      }),
    }))

    render(<AdminProjectsPage />)

    const linkedProposal = (await screen.findByText('Linked proposal')).closest('article')
    const unusedProposal = screen.getByText('Unused proposal').closest('article')
    expect(linkedProposal).not.toBeNull()
    expect(unusedProposal).not.toBeNull()
    expect(within(linkedProposal!).queryByRole('button', { name: 'Delete unused proposal' })).not.toBeInTheDocument()
    expect(within(unusedProposal!).getByRole('button', { name: 'Delete unused proposal' })).toBeInTheDocument()
  })
})
