import pandas as pd

# Load data
df = pd.read_csv("sales_data.csv")

# Data cleaning
df = df.drop_duplicates()
df["Sales"] = df["Sales"].fillna(df["Sales"].mean())

# Basic analysis
print("Total Sales:", df["Sales"].sum())
print("Average Sales:", df["Sales"].mean())
print("Max Sale:", df["Sales"].max())

# Sales by category
category_sales = df.groupby("Category")["Sales"].sum()
print("\nSales by Category:")
print(category_sales)

# Best selling product
product_sales = df.groupby("Product")["Sales"].sum()
print("\nBest Product:", product_sales.idxmax())

# Filter high sales
high_sales = df[df["Sales"] > 30000]
print("\nHigh Sales Records:")
print(high_sales)

# Sort data
sorted_data = df.sort_values(by="Sales", ascending=False)
print("\nSorted Data:")
print(sorted_data)
