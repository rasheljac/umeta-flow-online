
# Enhanced MS Processing Service with PyOpenMS

## Quick Start Guide

The MS Processing Service now automatically handles setup and provides both PyOpenMS and enhanced JavaScript fallback algorithms.

### Automatic Setup (Recommended)

The service will automatically attempt to start when you run your first analysis. No manual setup required!

1. **Upload your MS data files** in the web interface
2. **Create a workflow** with your desired processing steps
3. **Run the analysis** - the backend will auto-start if needed

### Manual Setup (If Needed)

If automatic setup doesn't work, you can manually start the service:

#### Option 1: Using the startup script
```bash
cd supabase/functions/ms-processing
chmod +x start_service.sh
./start_service.sh
```

#### Option 2: Using Python directly
```bash
cd supabase/functions/ms-processing
python3 auto_setup.py
```

#### Option 3: Using Docker (Full PyOpenMS)
```bash
cd supabase/functions/ms-processing
docker-compose up -d
```

### Service Status

You can check if the service is running by visiting:
- http://localhost:8001/health
- http://localhost:8001/ (service info)

### Features

#### Professional MS Processing
- **PyOpenMS Integration**: Uses professional algorithms when available
- **Enhanced Fallbacks**: Sophisticated JavaScript algorithms as backup
- **Auto-Detection**: Automatically chooses the best available method

#### Advanced Algorithms
1. **Peak Detection**:
   - PyOpenMS: `PeakPickerHiRes` with noise estimation
   - Fallback: Enhanced noise filtering with S/N calculation

2. **Peak Alignment**:
   - PyOpenMS: Advanced clustering algorithms
   - Fallback: Tolerance-based grouping with quality scoring

3. **Statistical Analysis**:
   - Real t-tests and Mann-Whitney U tests
   - Multiple testing correction (FDR, Bonferroni)
   - Effect size calculations (Cohen's d)

#### Database Integration (Coming Soon)
- MS2 spectral matching
- HMDB, METLIN, MassBank support
- Custom library uploads

### Troubleshooting

#### Service Won't Start
- Check if Python 3 is installed: `python3 --version`
- Try manual installation: `pip3 install -r requirements.txt`
- Check port 8001 availability: `lsof -i :8001`

#### PyOpenMS Installation Issues
- The service works without PyOpenMS using enhanced fallbacks
- On some systems, PyOpenMS may not install - this is normal
- All core functionality remains available

#### Connection Issues
- Ensure firewall allows port 8001
- Try restarting the service
- Check logs for error messages

### Performance

- **Small files**: Process instantly
- **Large files**: Streaming processing prevents memory issues
- **Multiple samples**: Parallel processing where possible

### API Endpoints

- `GET /health` - Service health and capabilities
- `POST /process` - Process workflow steps
- `GET /` - Service information

The service integrates seamlessly with your existing web interface - no changes needed to your workflow!
