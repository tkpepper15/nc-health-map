# North Carolina Healthcare Vulnerability Index (HCVI)

A comprehensive web application for visualizing healthcare vulnerability across North Carolina's 100 counties, with particular focus on the impacts of federal healthcare policy changes and Medicaid data analysis.

## 🏥 Project Overview

This application provides an interactive mapping platform to analyze healthcare vulnerability in North Carolina, inspired by the Climate-Conflict-Vulnerability Index (CCVI) methodology. It processes real Medicaid enrollment data and calculates composite vulnerability scores across multiple healthcare dimensions.

### Key Features

- **Interactive Map Visualization**: Real-time county-level choropleth maps using Mapbox GL JS
- **Medicaid Data Processing**: Automated ingestion and processing of NC DHHS Medicaid enrollment data
- **Vulnerability Scoring**: CCVI-inspired composite scoring across healthcare access, policy risk, and economic vulnerability
- **Data Export**: CSV, Excel, JSON, and GeoJSON export capabilities for research use
- **API-First Architecture**: RESTful APIs for data access and integration
- **Scalable Design**: Containerized deployment with PostgreSQL + PostGIS backend

## 🏗️ Architecture

### Frontend (Next.js + TypeScript)
- **Framework**: Next.js 15.4.1 with React 19 and App Router
- **Mapping**: Leaflet.js with custom healthcare data layers and reusable map components
- **Styling**: Tailwind CSS for responsive design
- **State Management**: React hooks with custom data management layer
- **Database**: Supabase with PostgreSQL and real-time capabilities
- **Data Fetching**: Custom service layer with proper error handling and caching
- **Performance**: Memory caching, debouncing, and performance monitoring utilities

### Backend Architecture
- **API Routes**: Next.js API routes with comprehensive error handling
- **Database**: Supabase PostgreSQL with PostGIS extension for geographic data
- **Service Layer**: Centralized healthcare and hospital data services
- **Type Safety**: Comprehensive TypeScript definitions across all layers
- **Caching**: Multiple caching strategies for optimal performance

### Infrastructure
- **Containerization**: Docker Compose for development environment
- **Database**: PostgreSQL with PostGIS for spatial data
- **Caching**: Redis for API response caching (optional)
- **Reverse Proxy**: Nginx configuration for production deployment

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
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)
- Mapbox Access Token (for map functionality)

### 1. Clone and Setup
```bash
git clone <repository-url>
cd nc-health-map

# Copy environment file and configure
cp .env.example .env
# Edit .env with your configuration
```

### 2. Docker Development Environment
```bash
# Start all services
docker-compose up -d

# Run database migrations
docker-compose exec backend python scripts/run_migrations.py

# Load initial county data
docker-compose exec backend python scripts/load_initial_data.py

# Process Medicaid data
docker-compose exec backend python scripts/process_medicaid_data.py
```

### 3. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/api/v1/docs
- **Database**: PostgreSQL on port 5432

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

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file with:
```env
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

### Deployment

#### Vercel (Recommended)
1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

#### Manual Deployment
1. Build the application: `npm run build`
2. Start the server: `npm run start`
3. Configure nginx using the provided `nginx.conf`

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

## 🚦 Performance

- **Fast loading**: Optimized assets and code splitting
- **Efficient rendering**: Virtualized lists and lazy loading
- **Smooth interactions**: Optimized map rendering and state management
- **Accessible**: WCAG 2.1 AA compliance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

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
