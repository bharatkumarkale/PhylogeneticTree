from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt

from Bio import SeqIO
import os,json

module_path = os.path.dirname(__file__)
alignment_file_name = os.path.join(module_path, "data/2024-10-30_MDH_prot.aln")
data = SeqIO.parse(alignment_file_name, "fasta")
alignment_data = {rec.id:str(rec.seq) for rec in data}

# Create your views here.
def index(request):
    return render(request, 'base.html')


@csrf_exempt
def getAlignmentData(request):
    return JsonResponse({'data': json.dumps(alignment_data)})