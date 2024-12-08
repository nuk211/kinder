'use client'

import { useEffect, useState } from 'react'
import { Loader2, X } from 'lucide-react'

interface AttendanceRecord {
  id: string
  date: string
  status: string
  checkInTime?: string
  checkOutTime?: string
}

interface Parent {
  id: string
  name: string
  email: string
  phoneNumber: string | null
}

interface Child {
  id: string
  name: string
  status: string
  qrCode: string
  attendanceRecords: AttendanceRecord[]
  parent: Parent
  createdAt: string
  updatedAt: string
}

interface ChildFormData {
  name: string
  parentId: string
  status: string
  qrCode?: string
}


const ChildrenList = () => {
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
  const [mode, setMode] = useState<'view' | 'edit' | 'create'>('view')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMainModal, setShowMainModal] = useState(false)
  const [availableParents, setAvailableParents] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [formData, setFormData] = useState<ChildFormData>({
    name: '',
    parentId: '',
    status: 'ABSENT',
    qrCode: '',
  })

  useEffect(() => {
    fetchChildren();
    fetchAvailableParents();
  }, [])

  const fetchChildren = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/children')
      if (!response.ok) throw new Error('Failed to fetch children')
      const data: Child[] = await response.json()
      setChildren(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }
  const fetchAvailableParents = async () => {
    try {
      const response = await fetch('/api/parents');
      if (!response.ok) throw new Error('Failed to fetch parents');
      const data = await response.json();
      setAvailableParents(data);
    } catch (error) {
      console.error('Error fetching parents:', error);
    }
  };
  //////////////////////////////////////
  const updateChildStatus = async (childId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/children/attendance/${childId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update status');
      }

      // Refresh the children list after successful update
      await fetchChildren();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update status');
    }
  };
  /////////////////////////////////////////////
  const handleCreateChild = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create child')
      }

      await fetchChildren()
      closeMainModal()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create child')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateChild = async () => {
    if (!selectedChild) return
    
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/children/${selectedChild.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update child')
      }

      await fetchChildren()
      closeMainModal()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update child')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteChild = async () => {
    if (!selectedChild) return
    
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/children/${selectedChild.id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete child')
      }

      await fetchChildren()
      closeDeleteModal()
      closeMainModal()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete child')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openMainModal = (child: Child | null, mode: 'view' | 'edit' | 'create') => {
    setSelectedChild(child)
    setMode(mode)
    setShowMainModal(true)
    setError(null)

    if (child && mode === 'edit') {
      setFormData({
        name: child.name,
        parentId: child.parent.id,
        status: child.status,
      })
    } else if (mode === 'create') {
      setFormData({
        name: '',
        parentId: '',
        status: 'ABSENT',
        qrCode: ''
      })
    }
  }

  const closeMainModal = () => {
    setSelectedChild(null)
    setMode('view')
    setShowMainModal(false)
    setError(null)
    setFormData({
      name: '',
      parentId: '',
      status: 'ABSENT',
      qrCode: ''
    })
  }

  const openDeleteModal = () => {
    setShowDeleteModal(true)
  }

  const closeDeleteModal = () => {
    setShowDeleteModal(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-green-100 text-green-800'
      case 'ABSENT':
        return 'bg-red-100 text-red-800'
      case 'PICKED_UP':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Children List</h2>
        <div className="space-x-4">
          <button
            onClick={() => openMainModal(null, 'create')}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Add Child
          </button>
          <button
            onClick={fetchChildren}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Children Table */}
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Updated</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {children.map((child) => (
                <tr key={child.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{child.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{child.parent.name}</div>
                    <div className="text-sm text-gray-500">{child.parent.phoneNumber}</div>
                  </td>
                  {/* ///////////////////////////////////// */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={child.status}
                      onChange={(e) => updateChildStatus(child.id, e.target.value)}
                      className={`px-2 text-xs font-semibold rounded-full ${getStatusColor(child.status)}`}
                    >
                      <option value="PRESENT">PRESENT</option>
                      <option value="ABSENT">ABSENT</option>
                      <option value="PICKED_UP">PICKED UP</option>
                    </select>
                  </td>
                  {/* ///////////////////////////////// */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(child.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => openMainModal(child, 'view')}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View
                    </button>
                    <button
                      onClick={() => openMainModal(child, 'edit')}
                      className="text-yellow-600 hover:text-yellow-900"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Modal */}
      {showMainModal && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={closeMainModal} />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {mode === 'create' ? 'Add New Child' : mode === 'edit' ? 'Edit Child' : 'Child Details'}
              </h3>
              <button onClick={closeMainModal} className="text-gray-400 hover:text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>

            {mode === 'view' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="mt-1">{selectedChild?.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <p className="mt-1">{selectedChild?.status.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Parent Name</label>
                    <p className="mt-1">{selectedChild?.parent.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Parent Email</label>
                    <p className="mt-1">{selectedChild?.parent.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone Number</label>
                    <p className="mt-1">{selectedChild?.parent.phoneNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">QR Code</label>
                    <p className="mt-1">{selectedChild?.qrCode}</p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-4">
                  <button
                    onClick={() => openMainModal(selectedChild, 'edit')}
                    className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={openDeleteModal}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                  >
                    Delete
                  </button>
                  <button
                    onClick={closeMainModal}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault()
                mode === 'create' ? handleCreateChild() : handleUpdateChild()
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  {/*  */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => {
                        if (mode === 'edit' && selectedChild) {
                          updateChildStatus(selectedChild.id, e.target.value);
                        } else {
                          setFormData({ ...formData, status: e.target.value });
                        }
                      }}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="ABSENT">Absent</option>
                      <option value="PRESENT">Present</option>
                      <option value="PICKED_UP">Picked Up</option>
                    </select>
                  </div>
                  {/* //////////////////////////////////////////////// */}
                  {mode === 'create' && (
      <div>
        <label className="block text-sm font-medium text-gray-700">Parent</label>
        <select
          value={formData.parentId}
          onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">Select a parent</option>
          {availableParents.map((parent) => (
            <option key={parent.id} value={parent.id}>
              {parent.name} ({parent.email})
            </option>
          ))}
        </select>
      </div>
    )}

                  <div className="mt-6 flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={closeMainModal}
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {mode === 'create' ? 'Creating...' : 'Saving...'}
                        </>
                      ) : (
                        mode === 'create' ? 'Create Child' : 'Save Changes'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[60]">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={closeDeleteModal} />
          <div className="fixed left-1/2 top-1/2 z-[60] w-full max-w-md -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete {selectedChild?.name}? This action cannot be undone.
              All associated attendance records will also be deleted.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={closeDeleteModal}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteChild}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChildrenList