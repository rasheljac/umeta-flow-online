
# PyOpenMS Backend Setup

This document explains how to set up the PyOpenMS backend for professional mass spectrometry processing.

## Architecture

The system consists of:
1. **Supabase Edge Function** (`index.ts`) - Acts as a proxy between frontend and Python service
2. **Python Service** (`python_service.py`) - Handles MS processing using PyOpenMS
3. **Docker Container** - Provides isolated environment for Python dependencies

## Setup Instructions

### Option 1: Docker Setup (Recommended)

1. **Navigate to the function directory:**
   ```bash
   cd supabase/functions/ms-processing
   ```

2. **Build and run the Docker container:**
   ```bash
   docker-compose up -d
   ```

3. **Verify the service is running:**
   ```bash
   curl http://localhost:8001/health
   ```

### Option 2: Local Python Setup

1. **Install system dependencies:**
   ```bash
   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install -y build-essential cmake git wget

   # macOS
   brew install cmake
   ```

2. **Create Python virtual environment:**
   ```bash
   cd supabase/functions/ms-processing
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the Python service:**
   ```bash
   python python_service.py
   ```

## Features

### Professional MS Processing with PyOpenMS

1. **Peak Detection:**
   - `PeakPickerHiRes` for centroiding profile data
   - `NoiseEstimatorMedian` for noise level estimation
   - Real signal-to-noise ratio calculations
   - Adaptive intensity thresholding

2. **Peak Alignment:**
   - Advanced clustering algorithms for RT alignment
   - m/z and RT tolerance-based grouping
   - Feature quality scoring

3. **Statistical Analysis:**
   - Real t-tests using scipy.stats
   - Multiple testing correction (FDR, Bonferroni)
   - Fold change calculations
   - Effect size analysis

### API Endpoints

- `POST /process` - Process workflow steps
- `GET /health` - Health check

### Workflow Steps Supported

- `peak_detection` - Professional peak detection using PyOpenMS
- `alignment` - Advanced peak alignment algorithms
- `statistics` - Real statistical analysis with scipy
- `filtering` - Data quality filtering
- `normalization` - Intensity normalization
- `identification` - Compound identification (planned)

## Troubleshooting

### Common Issues

1. **PyOpenMS installation fails:**
   - Ensure you have build tools installed
   - Try installing in a clean virtual environment
   - Check Python version compatibility (3.8-3.11)

2. **Docker container won't start:**
   - Check if port 8001 is available
   - Verify Docker daemon is running
   - Check container logs: `docker-compose logs`

3. **Backend connection fails:**
   - Ensure Python service is running on port 8001
   - Check firewall settings
   - Verify the health endpoint responds

### Logs and Debugging

- **Python service logs:** Check console output or container logs
- **Edge function logs:** Available in Supabase dashboard
- **Frontend logs:** Check browser console for connection errors

## Performance Considerations

- **Large files:** The service streams data to handle large mzML files
- **Memory usage:** PyOpenMS algorithms are memory-intensive
- **Processing time:** Complex workflows may take several minutes

## Future Enhancements

1. **MS2 Spectral Matching:**
   - MSP/MGF library support
   - Advanced similarity scoring
   - Fragment matching algorithms

2. **Database Integration:**
   - HMDB, METLIN, MassBank support
   - Online database queries
   - Custom library management

3. **Advanced Algorithms:**
   - Isotope pattern matching
   - Retention time prediction
   - Multi-modal identification

## Support

For issues related to:
- **PyOpenMS:** Check the official PyOpenMS documentation
- **Backend setup:** Review this setup guide
- **Frontend integration:** Check the processingService.ts implementation
