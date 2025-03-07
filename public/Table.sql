-- Create v5_departments table
CREATE TABLE v5_departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create v5_backgrounds table
CREATE TABLE v5_backgrounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_names VARCHAR(255) NOT NULL,
  citizenship VARCHAR(100) NOT NULL,
  id_passport_number VARCHAR(100) NOT NULL,
  passport_expiry_date DATE,
  department_id VARCHAR(100) NOT NULL,
  department_name VARCHAR(255),
  date_start DATE NOT NULL,
  date_end DATE NOT NULL,
  work_with VARCHAR(255) NOT NULL,
  contact_number VARCHAR(50),
  additional_info TEXT,
  status VARCHAR(20) DEFAULT 'Pending',
  closed_date DATE,
  closed_by UUID,
  type VARCHAR(50) NOT NULL DEFAULT 'internship',
  created_by UUID NOT NULL,
  updated_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for improved query performance
CREATE INDEX idx_backgrounds_type ON v5_backgrounds(type);
CREATE INDEX idx_backgrounds_id_passport ON v5_backgrounds(id_passport_number);
CREATE INDEX idx_backgrounds_status ON v5_backgrounds(status);
CREATE INDEX idx_backgrounds_date_end ON v5_backgrounds(date_end);