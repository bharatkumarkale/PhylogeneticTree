# PhylogeneticTree
Visualzing phylogentoc tree along with maft aligned sequences corresponding to the nodes in the tree 

## Steps
1. Clone the repo and cd to the repo's root directory
2. Create a conda env using the environment.yml file
```
conda env create -f environment.yml
```
3. Activate the the env
```
conda activate attention
```
4. Change to the django app directory
```
cd PhyloTree
``` 
5. Run the app
```
python manage.py runserver
```
6. Navigate to this URL on a web browser
```
http://127.0.0.1:8000/PhyloTreeVis/
```