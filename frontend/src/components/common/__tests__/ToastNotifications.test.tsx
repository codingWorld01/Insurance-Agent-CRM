import { render, screen } from '@testing-library/react'
import { useToastNotifications } from '@/hooks/useToastNotifications'
import { Button } from '@/components/ui/button'
import { expect } from 'vitest'
import { expect } from 'vitest'
import { expect } from 'vitest'
import { expect } from 'vitest'
import { expect } from 'vitest'
import { expect } from 'vitest'
import { expect } from 'vitest'
import { expect } from 'vitest'
import { expect } from 'vitest'
import { beforeEach } from 'vitest'

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}))

// Test component that uses toast notifications
function TestToastComponent() {
  const { showSuccess, showError, showInfo } = useToastNotifications()

  return (
    <div>
      <Button onClick={() => showSuccess('Success message', 'Success Title')}>
        Show Success
      </Button>
      <Button onClick={() => showError('Error message', 'Error Title')}>
        Show Error
      </Button>
      <Button onClick={() => showInfo('Info message', 'Info Title')}>
        Show Info
      </Button>
    </div>
  )
}

describe('Toast Notifications with White Descriptions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should call toast.success with white description styling', () => {
    const { toast } = require('sonner')
    
    render(<TestToastComponent />)
    
    const successButton = screen.getByText('Show Success')
    successButton.click()

    expect(toast.success).toHaveBeenCalledWith('Success Title', {
      description: 'Success message',
      style: {
        '--description-color': '#ffffff',
      },
      descriptionClassName: 'text-white',
    })
  })

  it('should call toast.error with white description styling', () => {
    const { toast } = require('sonner')
    
    render(<TestToastComponent />)
    
    const errorButton = screen.getByText('Show Error')
    errorButton.click()

    expect(toast.error).toHaveBeenCalledWith('Error Title', {
      description: 'Error message',
      style: {
        '--description-color': '#ffffff',
      },
      descriptionClassName: 'text-white',
    })
  })

  it('should call toast.info with white description styling', () => {
    const { toast } = require('sonner')
    
    render(<TestToastComponent />)
    
    const infoButton = screen.getByText('Show Info')
    infoButton.click()

    expect(toast.info).toHaveBeenCalledWith('Info Title', {
      description: 'Info message',
      style: {
        '--description-color': '#ffffff',
      },
      descriptionClassName: 'text-white',
    })
  })

  it('should use default titles when not provided', () => {
    const { toast } = require('sonner')
    const { showSuccess, showError, showInfo } = useToastNotifications()
    
    // Test default titles
    showSuccess('Success message')
    showError('Error message')
    showInfo('Info message')

    expect(toast.success).toHaveBeenCalledWith('Success', expect.any(Object))
    expect(toast.error).toHaveBeenCalledWith('Error', expect.any(Object))
    expect(toast.info).toHaveBeenCalledWith('Info', expect.any(Object))
  })
})