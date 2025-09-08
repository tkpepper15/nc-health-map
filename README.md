# North Carolina Healthcare Vulnerability Index (HCVI)

A comprehensive web application for visualizing healthcare vulnerability across North Carolina's 100 counties, with particular focus on the impacts of federal healthcare policy changes and real Medicaid enrollment data analysis.

## 🏥 Project Overview

This application provides an interactive mapping platform to analyze healthcare vulnerability in North Carolina, inspired by the Climate-Conflict-Vulnerability Index (CCVI) methodology. It processes real North Carolina Medicaid enrollment data and calculates composite vulnerability scores across multiple healthcare dimensions to inform evidence-based policy decisions.

### Key Features

- **Interactive County Maps**: Real-time choropleth visualization using Leaflet.js with county-level data
- **Medicaid Data Integration**: Processing and visualization of actual NC DHHS Medicaid enrollment statistics
- **Healthcare Vulnerability Index**: CCVI-inspired composite scoring across healthcare access, policy risk, and economic vulnerability
- **Multiple Data Layers**: Hospital locations, provider density, social determinants, and policy impact metrics
- **Data Export**: CSV, JSON, and GeoJSON export capabilities for research and policy analysis
- **Responsive Design**: Mobile-optimized interface with collapsible sidebar and touch-friendly interactions
- **Real-time Updates**: Live data updates with backend status monitoring

## 🏗️ Architecture

### Frontend (Next.js 15.4.1 + TypeScript)
- **Framework**: Next.js with React 19 and App Router for modern SSR/SSG capabilities
- **Mapping Engine**: Leaflet.js with custom NC county boundary layers and healthcare data overlays
- **Styling**: Tailwind CSS 4.1.12 for responsive, utility-first design
- **State Management**: Zustand for lightweight state management + custom hooks
- **Data Layer**: Supabase client with real-time subscriptions and caching
- **HTTP Client**: Axios with SWR for data fetching and caching strategies
- **Performance**: Memory optimization, debouncing, and lazy loading components

### Backend Architecture
- **API Layer**: Next.js API routes (`/api/healthcare-data`, `/api/hospitals-data`, `/api/process-data`)
- **Database**: Supabase PostgreSQL with PostGIS extension for spatial operations
- **Python Services**: FastAPI backend services for data processing and analysis
- **Data Pipeline**: Automated Medicaid data ingestion and transformation scripts
- **Type Safety**: Full TypeScript coverage with healthcare data type definitions

### Infrastructure & DevOps
- **Containerization**: Docker Compose setup with frontend, backend, and database services
- **Development**: Hot reload with Next.js dev server and Python FastAPI auto-reload
- **Database**: PostgreSQL + PostGIS for geographic data storage and spatial queries
- **Deployment**: Vercel-ready configuration with environment variable management

## 📊 Data Sources

### Primary Data
- **NC Medicaid Enrollment**: County-level enrollment by category (provided)
- **US Census**: Population and demographic data
- **HRSA**: Health Professional Shortage Areas
- **CMS**: Hospital financial data and quality metrics

### Calculated Metrics
- **Healthcare Access Score**: Provider density, travel times, insurance coverage
- **Policy Risk Score**: Medicaid dependency, federal funding reliance, SNAP vulnerability
- **Economic Vulnerability Score**: Hospital finances, private equity exposure, employment
- **Social Determinants Score**: Poverty, education, housing, transportation

## 🚀 Quick Start

### Prerequisites
- **Node.js 22+** (required by package.json engines)
- **npm 10+** (required by package.json engines)
- **Docker and Docker Compose** (for full-stack development)
- **Supabase Account** (for database and real-time features)

### 1. Clone and Setup Environment
```bash
git clone <repository-url>
cd nc-health-map

# Install frontend dependencies
npm install

# Create environment file
cp .env.example .env.local
# Add your Supabase credentials and other config
```

### 2. Environment Configuration
Create `.env.local` with:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional: API configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

### 3. Development Options

#### Option A: Frontend Only (Recommended for UI development)
```bash
# Start Next.js development server
npm run dev

# Access the application
open http://localhost:3000
```

#### Option B: Full-Stack with Docker
```bash
# Start all services (frontend, backend, database)
docker-compose up -d

# Access services
# Frontend: http://localhost:3000  
# Backend API: http://localhost:8000
# Database: PostgreSQL on port 5432
```

#### Option C: Backend Development
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Run FastAPI development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 📊 Data Structure

The application uses a comprehensive data model including:

### County Information
- Basic demographics and geography
- Rural/urban classification
- Population and area statistics

### Healthcare Metrics
- Provider density and specialty availability
- Hospital locations and financial health
- Insurance coverage and access barriers

### Policy Impact Data
- Medicaid expansion enrollment and risk
- Federal funding dependency
- SNAP program participation and vulnerability

### Economic Indicators
- Hospital financial margins and closure risk
- Private equity ownership and market concentration
- Healthcare employment and economic impact

## 🎨 Design System

The application follows a clean, professional design inspired by the Climate-Conflict-Vulnerability Index:

- **Layout**: Left sidebar with controls, main map area on right
- **Color Palette**: 
  - Healthcare Access: Blue (#4A90E2)
  - Policy Risk: Red (#E74C3C)
  - Economic Vulnerability: Orange (#F39C12)
  - Overall HCVI: Green to Red gradient
- **Typography**: Clean, readable fonts optimized for data visualization
- **Responsive**: Mobile-first design with progressive enhancement

## 📁 Project Structure

```
nc-health-map/
├── app/                          # Next.js App Router structure
│   ├── api/                      # API Routes
│   │   ├── healthcare-data/      # Healthcare metrics endpoints
│   │   ├── hospitals-data/       # Hospital data endpoints
│   │   └── process-data/         # Data processing endpoints
│   ├── components/               # React components
│   │   ├── County/               # County-specific components
│   │   ├── DataLayers/           # Data visualization layers
│   │   ├── Index/                # Main page components
│   │   ├── Layout/               # Layout components
│   │   ├── Map/                  # Mapping components (Leaflet-based)
│   │   └── UI/                   # Reusable UI components
│   ├── types/                    # TypeScript type definitions
│   │   └── healthcare.ts         # Healthcare data types
│   ├── utils/                    # Utility functions
│   │   ├── database.ts           # Database helpers
│   │   ├── dataLayers.ts         # Map data layer utilities
│   │   ├── medicaidHelpers.ts    # Medicaid data processing
│   │   ├── store.ts              # Zustand state management
│   │   └── supabase.ts           # Supabase client configuration
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout component
│   └── page.tsx                  # Main page component
├── backend/                      # Python FastAPI backend
│   ├── app/                      # FastAPI application
│   │   ├── api/                  # API endpoints
│   │   ├── core/                 # Core configuration
│   │   ├── models/               # Data models
│   │   └── schemas/              # Pydantic schemas
│   ├── data_processing/          # Data processing scripts
│   ├── scripts/                  # Utility scripts
│   ├── migrations/               # Database migrations
│   └── requirements.txt          # Python dependencies
├── public/                       # Static assets
├── docker-compose.yml            # Multi-service Docker setup
├── Dockerfile.frontend           # Frontend Docker configuration
└── package.json                  # Node.js dependencies and scripts
```

## 🔧 Configuration & Deployment

### Build and Development Scripts
```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Production server
npm run start

# Linting
npm run lint
```

### Deployment Options

#### Vercel (Recommended)
1. Connect repository to Vercel dashboard
2. Configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Deploy automatically on push to main branch

#### Docker Production Deployment
```bash
# Build and start production containers
docker-compose -f docker-compose.prod.yml up -d

# Or build frontend only
docker build -f Dockerfile.frontend -t nc-health-map-frontend .
docker run -p 3000:3000 nc-health-map-frontend
```

#### Manual Deployment
```bash
# Build the application
npm run build

# Start production server
npm run start

# Application available at http://localhost:3000
```

## 📱 Mobile Optimization

The application is fully responsive with:
- Touch-friendly map interactions
- Collapsible sidebar on mobile
- Optimized loading for slower connections
- Progressive web app capabilities

## 🔍 Key Counties Featured

### Extreme Vulnerability (HCVI 9-10)
- **Columbus County**: Worst health outcomes statewide
- **Robeson County**: High uninsured rates, rural challenges

### High Vulnerability (HCVI 7-8)
- **Swain County**: Remote location, limited infrastructure
- **Person County**: Hospital closure risk, economic challenges

### Low Vulnerability (HCVI 1-3)
- **Orange County**: Academic medical center (Chapel Hill)
- **Wake County**: State capital, healthcare hub (Raleigh)
- **Durham County**: Research Triangle, major healthcare systems

## 🚦 Performance & Technical Features

### Frontend Performance
- **Code Splitting**: Automatic route-based code splitting with Next.js
- **Image Optimization**: Next.js optimized images with lazy loading
- **State Management**: Efficient Zustand store with minimal re-renders
- **Caching**: SWR for API response caching and background revalidation
- **Memory Management**: Optimized component mounting/unmounting and cleanup

### Map Performance
- **Leaflet Optimization**: Custom county boundary rendering with performance monitoring
- **Data Layer Management**: Lazy loading of map layers and hospital markers
- **Interaction Optimization**: Debounced hover events and smooth transitions
- **Mobile Touch**: Touch-friendly map controls and gesture handling

### Accessibility
- **Screen Reader Support**: Semantic HTML and ARIA labels throughout
- **Keyboard Navigation**: Full keyboard accessibility for map and UI controls
- **High Contrast**: Color schemes optimized for accessibility compliance
- **Focus Management**: Proper focus handling for dynamic content updates

### Browser Support
- **Modern Browsers**: Chrome 90+, Firefox 90+, Safari 14+, Edge 90+
- **Progressive Enhancement**: Graceful degradation for older browsers
- **Mobile Support**: iOS Safari 14+, Chrome Mobile 90+

## 🔍 Data Processing Pipeline

### Medicaid Data Processing
1. **Data Ingestion**: Automated processing of NC DHHS Medicaid enrollment files
2. **Data Validation**: Type checking and data integrity validation
3. **Geographic Mapping**: County FIPS code matching and validation
4. **Index Calculation**: HCVI composite scoring across multiple dimensions
5. **Database Storage**: Efficient storage in Supabase with proper indexing

### Real-time Updates
- **Supabase Realtime**: Live data updates across connected clients
- **Status Monitoring**: Backend health monitoring with status indicators
- **Error Handling**: Comprehensive error boundaries and fallback states

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Install dependencies: `npm install`
4. Start development server: `npm run dev`
5. Make your changes with proper TypeScript types
6. Run linting: `npm run lint`
7. Commit changes: `git commit -m 'Add amazing feature'`
8. Push to branch: `git push origin feature/amazing-feature`
9. Open a Pull Request with detailed description

### Code Standards
- **TypeScript**: Full type coverage required
- **ESLint**: Must pass linting checks
- **Component Structure**: Follow existing patterns in `/app/components/`
- **Performance**: Consider loading states and error boundaries
- **Accessibility**: Maintain WCAG compliance

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- North Carolina State Center for Health Statistics
- Cecil G. Sheps Center for Health Services Research
- County Health Rankings & Roadmaps
- Climate-Conflict-Vulnerability Index for design inspiration

## 📞 Support

For questions or support, please contact:
- Email: [support-email]
- GitHub Issues: [repository-issues-url]

---

*This application was built to inform evidence-based policy decisions and resource allocation to protect vulnerable populations and maintain healthcare access across all 100 North Carolina counties.*
