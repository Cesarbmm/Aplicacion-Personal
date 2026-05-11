import { createMemoryHistory } from '@tanstack/history'
import { RouterProvider } from '@tanstack/react-router'
import { act } from 'react'
import { render } from '@testing-library/react'

import { createAppRouter } from '@/router'

export async function renderRoute(pathname: string) {
  const history = createMemoryHistory({
    initialEntries: [pathname],
  })
  const router = createAppRouter({ history })

  await act(async () => {
    render(<RouterProvider router={router} />)
    await router.load()
  })

  return router
}
