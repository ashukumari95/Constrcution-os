import React from 'react';
import { GenericGlobalView } from './GenericGlobalView';
import { TasksGlobalView } from './TasksGlobalView';
import { BoqGlobalView } from './BoqGlobalView';
import { ProcurementGlobalView } from './ProcurementGlobalView';

export { TasksGlobalView, BoqGlobalView, ProcurementGlobalView };

export const IssuesGlobalView = () => (
  <GenericGlobalView 
    title="Global Issues" 
    endpoint="/global/issues" 
    columns={[
      { header: 'Project', accessor: (row) => row.project?.name },
      { header: 'Title', accessor: (row) => row.title },
      { header: 'Type', accessor: (row) => row.type },
      { header: 'Priority', accessor: (row) => row.priority },
      { header: 'Status', accessor: (row) => row.status },
      { header: 'Reported By', accessor: (row) => row.reportedBy ? `${row.reportedBy.firstName} ${row.reportedBy.lastName}` : '-' },
    ]} 
  />
);

export const LabourGlobalView = () => (
  <GenericGlobalView 
    title="Global Labour" 
    endpoint="/global/labour" 
    columns={[
      { header: 'Name', accessor: (row) => `${row.firstName} ${row.lastName}` },
      { header: 'Category', accessor: (row) => row.category },
      { header: 'Type', accessor: (row) => row.type },
      { header: 'Project', accessor: (row) => row.project?.name || 'Unassigned' },
      { header: 'Contractor', accessor: (row) => row.contractor?.companyName || '-' },
    ]} 
  />
);

export const DprGlobalView = () => (
  <GenericGlobalView 
    title="Daily Progress Reports" 
    endpoint="/global/dpr" 
    columns={[
      { header: 'Project', accessor: (row) => row.project?.name },
      { header: 'Date', accessor: (row) => new Date(row.date).toLocaleDateString() },
      { header: 'Manpower', accessor: (row) => row.manpowerCount },
      { header: 'Status', accessor: (row) => row.status },
      { header: 'Prepared By', accessor: (row) => row.preparedBy ? `${row.preparedBy.firstName} ${row.preparedBy.lastName}` : '-' },
    ]} 
  />
);

export const FinanceGlobalView = () => (
  <GenericGlobalView 
    title="Finance & Invoices" 
    endpoint="/global/finance" 
    columns={[
      { header: 'Project', accessor: (row) => row.project?.name },
      { header: 'Invoice #', accessor: (row) => row.invoiceNumber },
      { header: 'Vendor', accessor: (row) => row.vendor?.name || '-' },
      { header: 'Total', accessor: (row) => `₹${row.total?.toLocaleString()}` },
      { header: 'Paid', accessor: (row) => `₹${row.amountPaid?.toLocaleString()}` },
      { header: 'Status', accessor: (row) => row.status },
    ]} 
  />
);

export const DocumentsGlobalView = () => (
  <GenericGlobalView 
    title="Global Documents" 
    endpoint="/global/documents" 
    columns={[
      { header: 'Project', accessor: (row) => row.project?.name },
      { header: 'Title', accessor: (row) => row.title },
      { header: 'Category', accessor: (row) => row.category },
      { header: 'Status', accessor: (row) => row.status },
    ]} 
  />
);

export const UsersGlobalView = () => (
  <GenericGlobalView 
    title="Users & Access" 
    endpoint="/global/users" 
    columns={[
      { header: 'Name', accessor: (row) => `${row.firstName} ${row.lastName}` },
      { header: 'Email', accessor: (row) => row.email },
      { header: 'Role', accessor: (row) => row.role?.name },
      { header: 'Status', accessor: (row) => row.status },
    ]} 
  />
);

export const InventoryGlobalView = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Inventory Overview</h1>
    <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
      Please view inventory details within specific projects.
    </div>
  </div>
);

export const ScheduleGlobalView = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Master Schedule</h1>
    <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
      Please view schedules within specific projects.
    </div>
  </div>
);

export const SettingsGlobalView = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Organization Settings</h1>
    <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
      Settings module is currently minimal.
    </div>
  </div>
);
