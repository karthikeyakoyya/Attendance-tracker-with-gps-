import pandas as pd
import json

# Use forward slashes in the path to avoid errors. This works on Windows.
file_path = "backend\cs_data_with_attendance.xlsx"

try:
    # Use read_excel for .xlsx files
    df = pd.read_excel(file_path)

    # Clean up column names by stripping any extra spaces
    df.columns = df.columns.str.strip()

    # --- THIS IS THE FIX ---
    # The column in your Excel file is 'Attendance' (capital A).
    # The key in the dictionary is the OLD name, the value is the NEW name.
    rename_mapping = {
        'admin no': 'admin no',
        'roll no': 'roll no',
        'name': 'name',
        'attendance': 'attendence' # Correctly map from 'Attendance' to 'attendence'
    }

    # Rename the columns
    df = df.rename(columns=rename_mapping)

    # Now we use the NEW names in the list of required columns
    required_columns = ['admin no', 'roll no', 'name', 'attendence']
    students_df = df[required_columns]

    # Convert the DataFrame to a list of dictionaries
    students_list = students_df.to_dict(orient='records')

    # Write the data to the final JSON file
    with open('backend\students.json', 'w') as json_file:
        json.dump(students_list, json_file, indent=4)

    print("Successfully converted the Excel data to students.json")

except FileNotFoundError:
    print(f"Error: The file was not found at the path: {file_path}")
    print("Please make sure the file exists and the path is correct.")
except KeyError as e:
    print(f"An error occurred because a column was not found. Missing column: {e}")
    print("Please check that the column names in your Python script match the Excel file exactly.")
    print(f"Columns found in the file are: {list(df.columns)}") # This will print the original columns if rename fails
except Exception as e:
    print(f"An unexpected error occurred: {e}")