#!/usr/bin/env python3
"""
Load initial NC county data and basic geographic information.
This script sets up the counties table with baseline data.
"""

import sys
import os
from pathlib import Path
import pandas as pd
import logging

# Add backend to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.database import get_db, SessionLocal
from app.core.config import settings
from app.models.county import County

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def load_nc_counties_baseline() -> pd.DataFrame:
    """
    Create baseline NC counties dataset with essential information.
    In production, this would load from official Census/USDA sources.
    """
    
    nc_counties_data = [
        # Format: (name, fips, population_2020, land_area_sq_miles, rural_urban_code, county_seat)
        ('Alamance County', '37001', 171415, 424.0, 3, 'Graham'),
        ('Alexander County', '37003', 36444, 259.0, 6, 'Taylorsville'),
        ('Alleghany County', '37005', 10888, 233.0, 8, 'Sparta'),
        ('Anson County', '37007', 22055, 531.0, 7, 'Wadesboro'),
        ('Ashe County', '37009', 26577, 427.0, 8, 'Jefferson'),
        ('Avery County', '37011', 17806, 247.0, 8, 'Newland'),
        ('Beaufort County', '37013', 44652, 827.0, 7, 'Washington'),
        ('Bertie County', '37015', 17934, 699.0, 9, 'Windsor'),
        ('Bladen County', '37017', 29606, 874.0, 8, 'Elizabethtown'),
        ('Brunswick County', '37019', 136693, 847.0, 5, 'Bolivia'),
        ('Buncombe County', '37021', 269452, 656.0, 2, 'Asheville'),
        ('Burke County', '37023', 87570, 507.0, 5, 'Morganton'),
        ('Cabarrus County', '37025', 225804, 363.0, 2, 'Concord'),
        ('Caldwell County', '37027', 80652, 471.0, 5, 'Lenoir'),
        ('Camden County', '37029', 10335, 178.0, 7, 'Camden'),
        ('Carteret County', '37031', 67686, 506.0, 5, 'Beaufort'),
        ('Caswell County', '37033', 22736, 427.0, 8, 'Yanceyville'),
        ('Catawba County', '37035', 160610, 400.0, 3, 'Newton'),
        ('Chatham County', '37037', 76285, 683.0, 4, 'Pittsboro'),
        ('Cherokee County', '37039', 28774, 455.0, 8, 'Murphy'),
        ('Chowan County', '37041', 13708, 172.0, 8, 'Edenton'),
        ('Clay County', '37043', 11089, 215.0, 8, 'Hayesville'),
        ('Cleveland County', '37045', 99519, 468.0, 4, 'Shelby'),
        ('Columbus County', '37047', 50623, 937.0, 8, 'Whiteville'),
        ('Craven County', '37049', 100720, 708.0, 4, 'New Bern'),
        ('Cumberland County', '37051', 334728, 652.0, 2, 'Fayetteville'),
        ('Currituck County', '37053', 28100, 255.0, 6, 'Currituck'),
        ('Dare County', '37055', 36915, 346.0, 8, 'Manteo'),
        ('Davidson County', '37057', 168930, 550.0, 4, 'Lexington'),
        ('Davie County', '37059', 42712, 264.0, 6, 'Mocksville'),
        ('Duplin County', '37061', 58698, 819.0, 8, 'Kenansville'),
        ('Durham County', '37063', 324833, 286.0, 2, 'Durham'),
        ('Edgecombe County', '37065', 48715, 506.0, 7, 'Tarboro'),
        ('Forsyth County', '37067', 382295, 410.0, 2, 'Winston-Salem'),
        ('Franklin County', '37069', 68573, 492.0, 5, 'Louisburg'),
        ('Gaston County', '37071', 227943, 356.0, 2, 'Gastonia'),
        ('Gates County', '37073', 10478, 340.0, 8, 'Gatesville'),
        ('Graham County', '37075', 8030, 292.0, 9, 'Robbinsville'),
        ('Granville County', '37077', 60992, 530.0, 5, 'Oxford'),
        ('Greene County', '37079', 20451, 265.0, 8, 'Snow Hill'),
        ('Guilford County', '37081', 533670, 646.0, 2, 'Greensboro'),
        ('Halifax County', '37083', 49587, 724.0, 8, 'Halifax'),
        ('Harnett County', '37085', 133568, 595.0, 4, 'Lillington'),
        ('Haywood County', '37087', 62089, 555.0, 7, 'Waynesville'),
        ('Henderson County', '37089', 116281, 374.0, 4, 'Hendersonville'),
        ('Hertford County', '37091', 21358, 355.0, 8, 'Winton'),
        ('Hoke County', '37093', 52082, 390.0, 5, 'Raeford'),
        ('Hyde County', '37095', 4589, 612.0, 9, 'Swan Quarter'),
        ('Iredell County', '37097', 186693, 573.0, 3, 'Statesville'),
        ('Jackson County', '37099', 43109, 491.0, 7, 'Sylva'),
        ('Johnston County', '37101', 215999, 791.0, 3, 'Smithfield'),
        ('Jones County', '37103', 9172, 471.0, 9, 'Trenton'),
        ('Lee County', '37105', 63285, 257.0, 5, 'Sanford'),
        ('Lenoir County', '37107', 55122, 400.0, 6, 'Kinston'),
        ('Lincoln County', '37109', 86810, 298.0, 4, 'Lincolnton'),
        ('McDowell County', '37111', 44578, 441.0, 7, 'Marion'),
        ('Macon County', '37113', 37014, 516.0, 7, 'Franklin'),
        ('Madison County', '37115', 21193, 449.0, 8, 'Marshall'),
        ('Martin County', '37117', 22031, 461.0, 8, 'Williamston'),
        ('Mecklenburg County', '37119', 1110356, 524.0, 1, 'Charlotte'),
        ('Mitchell County', '37121', 14709, 222.0, 8, 'Bakersville'),
        ('Montgomery County', '37123', 25751, 491.0, 8, 'Troy'),
        ('Moore County', '37125', 99727, 698.0, 4, 'Carthage'),
        ('Nash County', '37127', 94970, 540.0, 4, 'Nashville'),
        ('New Hanover County', '37129', 225702, 185.0, 2, 'Wilmington'),
        ('Northampton County', '37131', 17471, 526.0, 8, 'Jackson'),
        ('Onslow County', '37133', 204576, 763.0, 3, 'Jacksonville'),
        ('Orange County', '37135', 148696, 397.0, 2, 'Hillsborough'),
        ('Pamlico County', '37137', 12276, 337.0, 8, 'Bayboro'),
        ('Pasquotank County', '37139', 40568, 229.0, 4, 'Elizabeth City'),
        ('Pender County', '37141', 60898, 870.0, 5, 'Burgaw'),
        ('Perquimans County', '37143', 13005, 247.0, 8, 'Hertford'),
        ('Person County', '37145', 39097, 392.0, 6, 'Roxboro'),
        ('Pitt County', '37147', 170243, 652.0, 3, 'Greenville'),
        ('Polk County', '37149', 19328, 238.0, 7, 'Columbus'),
        ('Randolph County', '37151', 144171, 790.0, 5, 'Asheboro'),
        ('Richmond County', '37153', 42946, 474.0, 7, 'Rockingham'),
        ('Robeson County', '37155', 116530, 949.0, 6, 'Lumberton'),
        ('Rockingham County', '37157', 91096, 566.0, 5, 'Wentworth'),
        ('Rowan County', '37159', 146875, 511.0, 4, 'Salisbury'),
        ('Rutherford County', '37161', 64444, 564.0, 6, 'Rutherfordton'),
        ('Sampson County', '37163', 59036, 945.0, 7, 'Clinton'),
        ('Scotland County', '37165', 34174, 320.0, 6, 'Laurinburg'),
        ('Stanly County', '37167', 62504, 394.0, 6, 'Albemarle'),
        ('Stokes County', '37169', 44520, 452.0, 7, 'Danbury'),
        ('Surry County', '37171', 71359, 537.0, 6, 'Dobson'),
        ('Swain County', '37173', 14117, 527.0, 8, 'Bryson City'),
        ('Transylvania County', '37175', 32986, 378.0, 7, 'Brevard'),
        ('Tyrrell County', '37177', 3245, 390.0, 9, 'Columbia'),
        ('Union County', '37179', 238267, 631.0, 2, 'Monroe'),
        ('Vance County', '37181', 42578, 254.0, 5, 'Henderson'),
        ('Wake County', '37183', 1111761, 832.0, 1, 'Raleigh'),
        ('Warren County', '37185', 19344, 429.0, 8, 'Warrenton'),
        ('Washington County', '37187', 10725, 348.0, 9, 'Plymouth'),
        ('Watauga County', '37189', 54086, 312.0, 6, 'Boone'),
        ('Wayne County', '37191', 117333, 553.0, 4, 'Goldsboro'),
        ('Wilkes County', '37193', 65969, 757.0, 7, 'Wilkesboro'),
        ('Wilson County', '37195', 81234, 371.0, 4, 'Wilson'),
        ('Yadkin County', '37197', 37214, 334.0, 7, 'Yadkinville'),
        ('Yancey County', '37199', 18470, 313.0, 8, 'Burnsville')
    ]
    
    df = pd.DataFrame(nc_counties_data, columns=[
        'county_name', 'fips_code', 'population_2020', 'land_area_sq_miles', 
        'rural_urban_code', 'county_seat'
    ])
    
    # Add calculated fields
    df['state_code'] = 'NC'
    df['population_density'] = df['population_2020'] / df['land_area_sq_miles']
    
    # Add metropolitan status based on rural-urban code
    df['metropolitan_status'] = df['rural_urban_code'].map({
        1: 'metro', 2: 'metro', 3: 'metro',
        4: 'micro', 5: 'micro', 6: 'micro',
        7: 'rural', 8: 'rural', 9: 'rural'
    })
    
    # Add estimated median income and poverty rate (would use real Census data)
    # These are rough estimates for demonstration
    df['median_household_income'] = 50000 + (df['rural_urban_code'] * -3000)  # Urban counties higher
    df['poverty_rate'] = 20 - (df['rural_urban_code'] * -1.5)  # Rural counties higher poverty
    
    logger.info(f"Created baseline data for {len(df)} NC counties")
    
    return df


def load_counties_to_database(counties_df: pd.DataFrame) -> None:
    """
    Load counties data into the database.
    
    Args:
        counties_df: DataFrame with county information
    """
    db = SessionLocal()
    
    try:
        loaded_count = 0
        updated_count = 0
        
        for _, row in counties_df.iterrows():
            # Check if county already exists
            existing_county = db.query(County).filter(
                County.fips_code == row['fips_code']
            ).first()
            
            if existing_county:
                # Update existing county
                existing_county.county_name = row['county_name']
                existing_county.population_2020 = row['population_2020']
                existing_county.land_area_sq_miles = row['land_area_sq_miles']
                existing_county.population_density = row['population_density']
                existing_county.rural_urban_code = row['rural_urban_code']
                existing_county.metropolitan_status = row['metropolitan_status']
                existing_county.median_household_income = row['median_household_income']
                existing_county.poverty_rate = row['poverty_rate']
                existing_county.county_seat = row['county_seat']
                updated_count += 1
            else:
                # Create new county
                county = County(
                    fips_code=row['fips_code'],
                    county_name=row['county_name'],
                    state_code=row['state_code'],
                    population_2020=row['population_2020'],
                    land_area_sq_miles=row['land_area_sq_miles'],
                    population_density=row['population_density'],
                    rural_urban_code=row['rural_urban_code'],
                    metropolitan_status=row['metropolitan_status'],
                    median_household_income=row['median_household_income'],
                    poverty_rate=row['poverty_rate'],
                    county_seat=row['county_seat']
                )
                
                db.add(county)
                loaded_count += 1
        
        db.commit()
        logger.info(f"Database update complete: {loaded_count} new counties, {updated_count} updated")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Database loading failed: {e}")
        raise
    finally:
        db.close()


def main():
    """Main function to load initial county data."""
    
    try:
        logger.info("Loading NC counties baseline data")
        
        # Create baseline counties dataset
        counties_df = load_nc_counties_baseline()
        
        # Export to CSV for review
        output_file = Path(settings.PROCESSED_DATA_DIR) / "nc_counties_baseline.csv"
        output_file.parent.mkdir(parents=True, exist_ok=True)
        counties_df.to_csv(output_file, index=False)
        logger.info(f"Exported counties data to {output_file}")
        
        # Load to database
        load_counties_to_database(counties_df)
        
        logger.info("Initial data loading completed successfully")
        
    except Exception as e:
        logger.error(f"Initial data loading failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()